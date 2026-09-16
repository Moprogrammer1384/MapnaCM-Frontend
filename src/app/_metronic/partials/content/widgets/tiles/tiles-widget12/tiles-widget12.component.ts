import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-tiles-widget12',
  templateUrl: './tiles-widget12.component.html',
})
export class TilesWidget12Component implements OnInit {
  @Input() cssClass = '';
  @Input() widgetHeight = '150px';
  @Input() iconColor = 'success';
  iconCSSClass = '';

  constructor() {}

  ngOnInit() {
    this.iconCSSClass = `text-${this.iconColor}`;
  }
}
