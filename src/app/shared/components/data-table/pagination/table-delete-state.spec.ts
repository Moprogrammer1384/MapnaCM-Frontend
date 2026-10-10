import Swal, { SweetAlertResult } from 'sweetalert2';
import { TablePagination } from './table-pagination';

describe('TablePagination pending deletion', () => {
  const createTable = () => new TablePagination(
    [{ id: 1, name: 'Record' }], [{ key: 'name', title: 'Name', class: '' }], { searchKeys: ['name'] }
  );

  it('keeps the same saved ID locked across row snapshot replacements', () => {
    const table = createTable();
    const oldRow = table.rows[0];
    expect(table.beginDelete(oldRow)).toBeTrue();
    table.setRows([{ id: 1, name: 'Refreshed record' }]);
    const currentRow = table.rows[0];
    expect(currentRow).not.toBe(oldRow);
    expect(table.isDeleting(currentRow)).toBeTrue();
    expect(table.beginDelete(currentRow)).toBeFalse();
    table.endDelete(currentRow);
    expect(table.isDeleting(oldRow)).toBeFalse();
    expect(table.beginDelete(currentRow)).toBeTrue();
  });

  it('opens one confirmation and ignores confirmations for a pending delete', async () => {
    const table = createTable();
    let resolve: (result: SweetAlertResult) => void = () => undefined;
    const dialog = new Promise<SweetAlertResult>((accept) => resolve = accept);
    const alert = spyOn(Swal, 'fire').and.returnValue(dialog);
    const confirmed = jasmine.createSpy('confirmed');
    table.onConfirmedDelete = confirmed;
    table.confirmDelete(table.rows[0], 'Record');
    table.confirmDelete(table.rows[0], 'Record');
    expect(alert).toHaveBeenCalledTimes(1);
    resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true });
    await Promise.resolve();
    expect(confirmed).toHaveBeenCalledOnceWith(table.rows[0]);
    table.beginDelete(table.rows[0]);
    table.confirmDelete(table.rows[0], 'Record');
    expect(alert).toHaveBeenCalledTimes(1);
    table.endDelete(table.rows[0]);
    table.confirmDelete(table.rows[0], 'Record');
    expect(alert).toHaveBeenCalledTimes(2);
    await Promise.resolve();
  });
});
