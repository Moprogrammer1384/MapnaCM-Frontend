/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Node Align Left in Sankey
category: sankey
titleCN: 桑基图左对齐布局
difficulty: 3
*/
myChart.showLoading();
$.get(ROOT_PATH + '/data/asset/data/energy.json', function (data) {
    myChart.hideLoading();
    myChart.setOption((option = {
        title: {
            text: 'Node Align Left'
        },
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
        },
        series: [
            {
                type: 'sankey',
                emphasis: {
                    focus: 'adjacency'
                },
                nodeAlign: 'left',
                data: data.nodes,
                links: data.links,
                lineStyle: {
                    color: 'source',
                    curveness: 0.5
                }
            }
        ]
    }));
});
