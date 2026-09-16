/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Polar endAngle
category: bar
titleCN: 极坐标系 endAngle
difficulty: 2
*/
option = {
    tooltip: {},
    angleAxis: [
        {
            type: 'category',
            polarIndex: 0,
            startAngle: 90,
            endAngle: 0,
            data: ['S1', 'S2', 'S3']
        },
        {
            type: 'category',
            polarIndex: 1,
            startAngle: -90,
            endAngle: -180,
            data: ['T1', 'T2', 'T3']
        }
    ],
    radiusAxis: [{ polarIndex: 0 }, { polarIndex: 1 }],
    polar: [{}, {}],
    series: [
        {
            type: 'bar',
            polarIndex: 0,
            data: [1, 2, 3],
            coordinateSystem: 'polar'
        },
        {
            type: 'bar',
            polarIndex: 1,
            data: [1, 2, 3],
            coordinateSystem: 'polar'
        }
    ]
};
