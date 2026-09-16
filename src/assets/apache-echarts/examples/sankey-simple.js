/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Basic Sankey
category: sankey
titleCN: 基础桑基图
difficulty: 0
*/
option = {
    series: {
        type: 'sankey',
        layout: 'none',
        emphasis: {
            focus: 'adjacency'
        },
        data: [
            {
                name: 'a'
            },
            {
                name: 'b'
            },
            {
                name: 'a1'
            },
            {
                name: 'a2'
            },
            {
                name: 'b1'
            },
            {
                name: 'c'
            }
        ],
        links: [
            {
                source: 'a',
                target: 'a1',
                value: 5
            },
            {
                source: 'a',
                target: 'a2',
                value: 3
            },
            {
                source: 'b',
                target: 'b1',
                value: 8
            },
            {
                source: 'a',
                target: 'b1',
                value: 3
            },
            {
                source: 'b1',
                target: 'a1',
                value: 1
            },
            {
                source: 'b1',
                target: 'c',
                value: 2
            }
        ]
    }
};
