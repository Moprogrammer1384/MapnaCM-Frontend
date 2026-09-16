/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Transition between Treemap and Sunburst
category: treemap
titleCN: 矩形树图和旭日图的动画过渡
difficulty: 4
videoStart: 3000
videoEnd: 9000
*/
$.getJSON(ROOT_PATH + '/data/asset/data/echarts-package-size.json', function (data) {
    const treemapOption = {
        series: [
            {
                type: 'treemap',
                id: 'echarts-package-size',
                animationDurationUpdate: 1000,
                roam: false,
                nodeClick: undefined,
                data: data.children,
                universalTransition: true,
                label: {
                    show: true
                },
                breadcrumb: {
                    show: false
                }
            }
        ]
    };
    const sunburstOption = {
        series: [
            {
                type: 'sunburst',
                id: 'echarts-package-size',
                radius: ['20%', '90%'],
                animationDurationUpdate: 1000,
                nodeClick: undefined,
                data: data.children,
                universalTransition: true,
                itemStyle: {
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,.5)'
                },
                label: {
                    show: false
                }
            }
        ]
    };
    let currentOption = treemapOption;
    myChart.setOption(currentOption);
    setInterval(function () {
        currentOption =
            currentOption === treemapOption ? sunburstOption : treemapOption;
        myChart.setOption(currentOption);
    }, 3000);
});
