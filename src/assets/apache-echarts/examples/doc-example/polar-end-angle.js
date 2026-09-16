/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
    tooltip: {},
    angleAxis: {
        type: 'category',
        endAngle: -180,
        data: ['S1', 'S2', 'S3']
    },
    radiusAxis: {},
    polar: {},
    series: [{
        type: 'bar',
        polarIndex: 0,
        data: [1, 2, 3],
        coordinateSystem: 'polar'
    }]
};
