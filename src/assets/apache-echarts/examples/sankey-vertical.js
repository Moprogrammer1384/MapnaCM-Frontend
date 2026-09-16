/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Sankey Orient Vertical
category: sankey
titleCN: 垂直方向的桑基图
difficulty: 1
*/
option = {
    tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
    },
    animation: false,
    series: [
        {
            type: 'sankey',
            bottom: '10%',
            emphasis: {
                focus: 'adjacency'
            },
            data: [
                { name: 'a' },
                { name: 'b' },
                { name: 'a1' },
                { name: 'b1' },
                { name: 'c' },
                { name: 'e' }
            ],
            links: [
                { source: 'a', target: 'a1', value: 5 },
                { source: 'e', target: 'b', value: 3 },
                { source: 'a', target: 'b1', value: 3 },
                { source: 'b1', target: 'a1', value: 1 },
                { source: 'b1', target: 'c', value: 2 },
                { source: 'b', target: 'c', value: 1 }
            ],
            orient: 'vertical',
            label: {
                position: 'top'
            },
            lineStyle: {
                color: 'source',
                curveness: 0.5
            }
        }
    ]
};
