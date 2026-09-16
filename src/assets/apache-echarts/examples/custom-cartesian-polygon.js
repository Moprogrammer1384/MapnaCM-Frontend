/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Custom Cartesian Polygon
titleCN: 自定义多边形图
category: custom
difficulty: 3
*/
const data = [];
const dataCount = 7;
for (let i = 0; i < dataCount; i++) {
    data.push([
        echarts.number.round(Math.random() * 100),
        echarts.number.round(Math.random() * 400)
    ]);
}
option = {
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data: ['polygon']
    },
    dataZoom: [
        {
            type: 'slider',
            filterMode: 'none'
        },
        {
            type: 'inside',
            filterMode: 'none'
        }
    ],
    xAxis: {},
    yAxis: {},
    series: [
        {
            type: 'custom',
            name: 'polygon',
            renderItem: function (params, api) {
                if (params.context.rendered) {
                    return;
                }
                params.context.rendered = true;
                let points = [];
                for (let i = 0; i < data.length; i++) {
                    points.push(api.coord(data[i]));
                }
                let color = api.visual('color');
                return {
                    type: 'polygon',
                    transition: ['shape'],
                    shape: {
                        points: points
                    },
                    style: api.style({
                        fill: color,
                        stroke: echarts.color.lift(color, 0.1)
                    })
                };
            },
            clip: true,
            data: data
        }
    ]
};
