/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
/*
title: Multiple Funnels
category: funnel
titleCN: 多漏斗图
*/
option = {
    title: {
        text: 'Funnel',
        left: 'left',
        top: 'bottom'
    },
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c}%'
    },
    toolbox: {
        orient: 'vertical',
        top: 'center',
        feature: {
            dataView: { readOnly: false },
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        data: ['Show', 'Click', 'Visit', 'Inquiry', 'Order']
    },
    series: [
        {
            name: 'Funnel',
            type: 'funnel',
            width: '40%',
            height: '45%',
            left: '5%',
            top: '50%',
            data: [
                { value: 60, name: 'Visit' },
                { value: 30, name: 'Inquiry' },
                { value: 10, name: 'Order' },
                { value: 80, name: 'Click' },
                { value: 100, name: 'Show' }
            ]
        },
        {
            name: 'Pyramid',
            type: 'funnel',
            width: '40%',
            height: '45%',
            left: '5%',
            top: '5%',
            sort: 'ascending',
            data: [
                { value: 60, name: 'Visit' },
                { value: 30, name: 'Inquiry' },
                { value: 10, name: 'Order' },
                { value: 80, name: 'Click' },
                { value: 100, name: 'Show' }
            ]
        },
        {
            name: 'Funnel',
            type: 'funnel',
            width: '40%',
            height: '45%',
            left: '55%',
            top: '5%',
            label: {
                position: 'left'
            },
            data: [
                { value: 60, name: 'Visit' },
                { value: 30, name: 'Inquiry' },
                { value: 10, name: 'Order' },
                { value: 80, name: 'Click' },
                { value: 100, name: 'Show' }
            ]
        },
        {
            name: 'Pyramid',
            type: 'funnel',
            width: '40%',
            height: '45%',
            left: '55%',
            top: '50%',
            sort: 'ascending',
            label: {
                position: 'left'
            },
            data: [
                { value: 60, name: 'Visit' },
                { value: 30, name: 'Inquiry' },
                { value: 10, name: 'Order' },
                { value: 80, name: 'Click' },
                { value: 100, name: 'Show' }
            ]
        }
    ]
};
