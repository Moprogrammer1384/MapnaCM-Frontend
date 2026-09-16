/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
    legend: {
        data: ['pictorialBar', 'bar']
    },
    xAxis: {
        data: ['symbolRepeat: true', 'symbolRepeat: false']
    },
    yAxis: {
        splitLine: {show: false}
    },
    animationEasing: 'elasticOut',
    series: [{
        type: 'pictorialBar',
        symbol: 'circle',
        data: [{
            value: 29000,
            symbolRepeat: true,
            symbolSize: [50, 50]
        }, {
            value: 29000,
            symbolSize: [50, '100%']
        }]
    }]
};
