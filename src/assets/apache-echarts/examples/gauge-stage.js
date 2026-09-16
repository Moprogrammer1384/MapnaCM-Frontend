/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Stage Speed Gauge
titleCN: 阶段速度仪表盘
category: gauge
difficulty: 3
*/
option = {
    series: [
        {
            type: 'gauge',
            axisLine: {
                lineStyle: {
                    width: 30,
                    color: [
                        [0.3, '#67e0e3'],
                        [0.7, '#37a2da'],
                        [1, '#fd666d']
                    ]
                }
            },
            pointer: {
                itemStyle: {
                    color: 'auto'
                }
            },
            axisTick: {
                distance: -30,
                length: 8,
                lineStyle: {
                    color: '#fff',
                    width: 2
                }
            },
            splitLine: {
                distance: -30,
                length: 30,
                lineStyle: {
                    color: '#fff',
                    width: 4
                }
            },
            axisLabel: {
                color: 'inherit',
                distance: 40,
                fontSize: 20
            },
            detail: {
                valueAnimation: true,
                formatter: '{value} km/h',
                color: 'inherit'
            },
            data: [
                {
                    value: 70
                }
            ]
        }
    ]
};
setInterval(function () {
    myChart.setOption({
        series: [
            {
                data: [
                    {
                        value: +(Math.random() * 100).toFixed(2)
                    }
                ]
            }
        ]
    });
}, 2000);
