/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Rounded Bar on Polar
category: bar
titleCN: 圆角环形图
difficulty: 7
*/
option = {
    angleAxis: {
        max: 2,
        startAngle: 30,
        splitLine: {
            show: false
        }
    },
    radiusAxis: {
        type: 'category',
        data: ['v', 'w', 'x', 'y', 'z'],
        z: 10
    },
    polar: {},
    series: [
        {
            type: 'bar',
            data: [4, 3, 2, 1, 0],
            coordinateSystem: 'polar',
            name: 'Without Round Cap',
            itemStyle: {
                borderColor: 'red',
                opacity: 0.8,
                borderWidth: 1
            }
        },
        {
            type: 'bar',
            data: [4, 3, 2, 1, 0],
            coordinateSystem: 'polar',
            name: 'With Round Cap',
            roundCap: true,
            itemStyle: {
                borderColor: 'green',
                opacity: 0.8,
                borderWidth: 1
            }
        }
    ],
    legend: {
        show: true,
        data: ['Without Round Cap', 'With Round Cap']
    }
};
