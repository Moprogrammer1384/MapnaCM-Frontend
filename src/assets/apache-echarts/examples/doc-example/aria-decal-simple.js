/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
    xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
    }, {
        data: [20, 40, 90, 40, 30, 70, 120],
        type: 'bar'
    }, {
        data: [140, 230, 120, 50, 30, 150, 120],
        type: 'bar'
    }],
    aria: {
        enabled: true,
        decal: {
            show: true
        }
    }
};
