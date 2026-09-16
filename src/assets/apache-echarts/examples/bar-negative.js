/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Bar Chart with Negative Value
titleCN: 正负条形图
category: bar
difficulty: 4
*/
option = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    legend: {
        data: ['Profit', 'Expenses', 'Income']
    },
    xAxis: [
        {
            type: 'value'
        }
    ],
    yAxis: [
        {
            type: 'category',
            axisTick: {
                show: false
            },
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        }
    ],
    series: [
        {
            name: 'Profit',
            type: 'bar',
            label: {
                show: true,
                position: 'inside'
            },
            emphasis: {
                focus: 'series'
            },
            data: [200, 170, 240, 244, 200, 220, 210]
        },
        {
            name: 'Income',
            type: 'bar',
            stack: 'Total',
            label: {
                show: true
            },
            emphasis: {
                focus: 'series'
            },
            data: [320, 302, 341, 374, 390, 450, 420]
        },
        {
            name: 'Expenses',
            type: 'bar',
            stack: 'Total',
            label: {
                show: true,
                position: 'left'
            },
            emphasis: {
                focus: 'series'
            },
            data: [-120, -132, -101, -134, -190, -230, -210]
        }
    ]
};
