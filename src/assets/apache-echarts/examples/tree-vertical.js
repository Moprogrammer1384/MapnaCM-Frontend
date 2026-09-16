/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: From Top to Bottom Tree
category: tree
titleCN: 从上到下树状图
*/
myChart.showLoading();
$.get(ROOT_PATH + '/data/asset/data/flare.json', function (data) {
    myChart.hideLoading();
    myChart.setOption((option = {
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
        },
        series: [
            {
                type: 'tree',
                data: [data],
                left: '2%',
                right: '2%',
                top: '8%',
                bottom: '20%',
                symbol: 'emptyCircle',
                orient: 'vertical',
                expandAndCollapse: true,
                label: {
                    position: 'top',
                    rotate: -90,
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: 9
                },
                leaves: {
                    label: {
                        position: 'bottom',
                        rotate: -90,
                        verticalAlign: 'middle',
                        align: 'left'
                    }
                },
                animationDurationUpdate: 750
            }
        ]
    }));
});
