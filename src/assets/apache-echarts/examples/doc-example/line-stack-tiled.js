/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
    title: {
        text: '某楼盘销售情况',
        subtext: '纯属虚构'
    },
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data:['意向','预购','成交']
    },
    toolbox: {
        show: true,
        feature: {
            magicType: {show: true, type: ['stack', 'tiled']},
            saveAsImage: {show: true}
        }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一','周二','周三','周四','周五','周六','周日']
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        name: '成交',
        type: 'line',
        smooth: true,
        data: [10, 12, 21, 54, 260, 830, 710]
    },
    {
        name: '预购',
        type: 'line',
        smooth: true,
        data: [30, 182, 434, 791, 390, 30, 10]
    },
    {
        name: '意向',
        type: 'line',
        smooth: true,
        data: [1320, 1132, 601, 234, 120, 90, 20]
    }]
};
