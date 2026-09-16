/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Chord minAngle
category: chord
titleCN: 和弦图 minAngle
difficulty: 1
since: 6.0.0
*/
option = {
    tooltip: {},
    legend: {},
    series: [
        {
            type: 'chord',
            label: { show: true },
            minAngle: 30,
            data: [
                { name: 'A' },
                { name: 'B' },
                { name: 'C' },
                { name: 'D' },
                { name: 'E' },
                { name: 'F' }
            ],
            links: [
                { source: 'A', target: 'B', value: 40 },
                { source: 'B', target: 'C', value: 20 },
                { source: 'E', target: 'A', value: 5 }
            ]
        }
    ]
};
