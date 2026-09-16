/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Basic Chord
category: chord
titleCN: 基础和弦图
difficulty: 0
since: 6.0.0
*/
option = {
    tooltip: {},
    legend: {},
    series: [
        {
            type: 'chord',
            clockwise: false,
            label: { show: true },
            lineStyle: { color: 'target' },
            data: [
                { name: 'A' },
                { name: 'B' },
                { name: 'C' },
                { name: 'D' }
            ],
            links: [
                { source: 'A', target: 'B', value: 40 },
                { source: 'A', target: 'C', value: 20 },
                { source: 'B', target: 'D', value: 20 },
            ]
        }
    ]
};
