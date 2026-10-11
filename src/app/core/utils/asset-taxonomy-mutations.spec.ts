import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { finalize, Subject } from 'rxjs';
import type { PlantType } from '../models/asset-taxonomy.model';
import { MetronicAlertService } from '../services/metronic-alert.service';
import { TablePagination } from 'src/app/shared/components/data-table/pagination/table-pagination';
import { AssetTaxonomyMutations } from './asset-taxonomy-mutations';

describe('AssetTaxonomyMutations', () => {
  let page: { saving: boolean };
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
  let destroyRef: DestroyRef;
  let callbacks: Set<() => void>;
  let mutations: AssetTaxonomyMutations;
  let table: TablePagination<PlantType>;
  const row: PlantType = { id: 7, name: 'Type' };

  beforeEach(() => {
    page = { saving: false };
    alerts = jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']);
    cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    callbacks = new Set();
    destroyRef = { onDestroy: (callback) => { callbacks.add(callback); return () => callbacks.delete(callback); } };
    mutations = new AssetTaxonomyMutations(page, destroyRef, alerts, cdr);
    table = new TablePagination<PlantType>([row], [{ key: 'name', title: 'Name', class: '' }], { searchKeys: ['name'] });
  });

  afterEach(() => Array.from(callbacks).forEach((callback) => callback()));

  it('sets the page flag before creating a save request and clears it before success actions', () => {
    const response = new Subject<void>();
    const success = jasmine.createSpy('success').and.callFake(() => expect(page.saving).toBeFalse());
    mutations.save(() => {
      expect(page.saving).toBeTrue();
      return response;
    }, success);
    response.next();
    response.complete();
    expect(success).toHaveBeenCalledTimes(1);
    expect(alerts.show).not.toHaveBeenCalled();
  });

  it('does not create another save request while the page is saving', () => {
    const request = jasmine.createSpy('request');
    page.saving = true;
    mutations.save(request, jasmine.createSpy('success'));
    expect(request).not.toHaveBeenCalled();
  });

  it('restores actions and repaints before displaying a failed save message', () => {
    const response = new Subject<void>();
    const events: string[] = [];
    cdr.detectChanges.and.callFake(() => { expect(page.saving).toBeFalse(); events.push('repaint'); });
    alerts.show.and.callFake(() => events.push('error'));
    const success = jasmine.createSpy('success');
    mutations.save(() => response, success);
    response.error({ message: 'Rejected by server' });
    expect(events).toEqual(['repaint', 'error']);
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Rejected by server');
    expect(success).not.toHaveBeenCalled();
  });

  it('uses the existing fallback for failures without a message', () => {
    const save = new Subject<void>();
    mutations.save(() => save, () => undefined);
    save.error(null);
    expect(alerts.show).toHaveBeenCalledWith('error', 'Error!', 'The request failed.');
    const deletion = new Subject<void>();
    mutations.delete(row, table, () => deletion, () => undefined, 'Unable to delete the type.');
    deletion.error({});
    expect(alerts.show).toHaveBeenCalledWith('error', 'Error!', 'Unable to delete the type.');
  });

  it('keeps saving state independent between pages', () => {
    const first = new Subject<void>();
    const second = new Subject<void>();
    const otherPage = { saving: false };
    mutations.save(() => first, () => undefined);
    new AssetTaxonomyMutations(otherPage, destroyRef, alerts, cdr).save(() => second, () => undefined);
    first.error(new Error('Failed'));
    expect(page.saving).toBeFalse();
    expect(otherPage.saving).toBeTrue();
    second.next();
    second.complete();
    expect(otherPage.saving).toBeFalse();
  });

  it('locks a deletion before request creation and releases it after the success callback', () => {
    const response = new Subject<void>();
    const success = jasmine.createSpy('success').and.callFake(() => expect(table.isDeleting(row)).toBeTrue());
    mutations.delete(row, table, (id) => {
      expect(id).toBe(7);
      expect(table.isDeleting(row)).toBeTrue();
      return response;
    }, success, 'Delete failed');
    response.next();
    response.complete();
    expect(success).toHaveBeenCalledTimes(1);
    expect(table.isDeleting(row)).toBeFalse();
    expect(page.saving).toBeFalse();
  });

  it('blocks duplicate deletion after row snapshot replacement and unlocks a rejected request', () => {
    const response = new Subject<void>();
    const request = jasmine.createSpy('request').and.returnValue(response);
    const success = jasmine.createSpy('success');
    mutations.delete(row, table, request, success, 'Delete failed');
    table.setRows([{ id: 7, name: 'Refreshed type' }]);
    mutations.delete(table.rows[0], table, request, success, 'Delete failed');
    expect(request).toHaveBeenCalledOnceWith(7);
    response.error(new Error('Type is in use'));
    expect(success).not.toHaveBeenCalled();
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Type is in use');
    expect(table.isDeleting(table.rows[0])).toBeFalse();
  });

  it('guards unsaved records and active saves while allowing a zero-valued saved ID', () => {
    const response = new Subject<void>();
    const request = jasmine.createSpy('request').and.returnValue(response);
    mutations.delete({ name: 'Unsaved' }, table, request, () => undefined, 'Delete failed');
    page.saving = true;
    mutations.delete(row, table, request, () => undefined, 'Delete failed');
    expect(request).not.toHaveBeenCalled();
    page.saving = false;
    mutations.delete({ id: 0, name: 'Zero ID' }, table, request, () => undefined, 'Delete failed');
    expect(request).toHaveBeenCalledOnceWith(0);
    response.complete();
  });

  it('cancels outstanding writes and releases deletion locks when the page scope is destroyed', () => {
    const save = new Subject<void>();
    const deletion = new Subject<void>();
    const cancelled = jasmine.createSpy('cancelled');
    const success = jasmine.createSpy('success');
    mutations.delete(row, table, () => deletion.pipe(finalize(cancelled)), success, 'Delete failed');
    mutations.save(() => save.pipe(finalize(cancelled)), success);
    Array.from(callbacks).forEach((callback) => callback());
    save.next();
    deletion.next();
    expect(cancelled).toHaveBeenCalledTimes(2);
    expect(table.isDeleting(row)).toBeFalse();
    expect(success).not.toHaveBeenCalled();
    expect(alerts.show).not.toHaveBeenCalled();
  });
});
