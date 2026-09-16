/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
    radar: {
        indicator: [
            { text: '指标一' },
            { text: '指标二' },
            { text: '指标三' },
            { text: '指标四' },
            { text: '指标五' }
        ],
        center: ['50%', '50%'],
        radius: '80%',
        startAngle: 90,
        splitNumber: 4,
        shape: 'circle',
        name: {
            formatter:'【{value}】',
            textStyle: {
                color:'#72ACD1'
            }
        },
        splitArea: {
            areaStyle: {
                color: ['#B8D3E4', '#96C5E3', '#7DB5DA', '#72ACD1']
            }
        },
        axisTick: {
            show: true,
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.8)'
            }
        },
        axisLabel: {
            show: true,
            textStyle: {
                color: 'white'
            }
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.4)'
            }
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.4)'
            }
        }
    }
};
