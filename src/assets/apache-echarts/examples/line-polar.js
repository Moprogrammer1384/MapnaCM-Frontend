/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Two Value-Axes in Polar
category: line
titleCN: 极坐标双数值轴
difficulty: 10
*/
const data = [];
for (let i = 0; i <= 100; i++) {
    let theta = (i / 100) * 360;
    let r = 5 * (1 + Math.sin((theta / 180) * Math.PI));
    data.push([r, theta]);
}
option = {
    title: {
        text: 'Two Value-Axes in Polar'
    },
    legend: {
        data: ['line']
    },
    polar: {},
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
    },
    angleAxis: {
        type: 'value',
        startAngle: 0
    },
    radiusAxis: {},
    series: [
        {
            coordinateSystem: 'polar',
            name: 'line',
            type: 'line',
            data: data
        }
    ]
};
