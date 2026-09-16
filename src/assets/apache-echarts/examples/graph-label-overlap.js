/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Hide Overlapped Label
category: graph
titleCN: 关系图自动隐藏重叠标签
difficulty: 3
*/
myChart.showLoading();
$.getJSON(ROOT_PATH + '/data/asset/data/les-miserables.json', function (graph) {
    myChart.hideLoading();
    option = {
        tooltip: {},
        legend: [
            {
                data: graph.categories.map(function (a) {
                    return a.name;
                })
            }
        ],
        series: [
            {
                name: 'Les Miserables',
                type: 'graph',
                layout: 'none',
                data: graph.nodes,
                links: graph.links,
                categories: graph.categories,
                roam: true,
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}'
                },
                labelLayout: {
                    hideOverlap: true
                },
                scaleLimit: {
                    min: 0.4,
                    max: 2
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.3
                }
            }
        ]
    };
    myChart.setOption(option);
});
