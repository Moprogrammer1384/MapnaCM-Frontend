/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Stacked Bar Chart on Polar
titleCN: 极坐标系下的堆叠柱状图
category: bar
difficulty: 7
*/
option = {
    angleAxis: {},
    radiusAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu'],
        z: 10
    },
    polar: {},
    series: [
        {
            type: 'bar',
            data: [1, 2, 3, 4],
            coordinateSystem: 'polar',
            name: 'A',
            stack: 'a',
            emphasis: {
                focus: 'series'
            }
        },
        {
            type: 'bar',
            data: [2, 4, 6, 8],
            coordinateSystem: 'polar',
            name: 'B',
            stack: 'a',
            emphasis: {
                focus: 'series'
            }
        },
        {
            type: 'bar',
            data: [1, 2, 3, 4],
            coordinateSystem: 'polar',
            name: 'C',
            stack: 'a',
            emphasis: {
                focus: 'series'
            }
        }
    ],
    legend: {
        show: true,
        data: ['A', 'B', 'C']
    }
};
