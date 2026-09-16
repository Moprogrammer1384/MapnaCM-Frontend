/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Gauge Basic chart
titleCN: 基础仪表盘
category: gauge
difficulty: 1
*/
option = {
    tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
        {
            name: 'Pressure',
            type: 'gauge',
            detail: {
                formatter: '{value}'
            },
            data: [
                {
                    value: 50,
                    name: 'SCORE'
                }
            ]
        }
    ]
};
