$.extend($.fn.tabs.methods, {
    getTabById: function (jq, id) {
        let tabs = jq.tabs('tabs');
        for (let i = 0; i < tabs.length; i++) {
            let tab = tabs[i];
            if (tab.panel('options').id === id) {
                return tab;
            }
        }
        return null;
    },
    selectById: function (jq, id) {
        let tab = null;
        let tabs = jq.tabs('tabs');
        for (let i = 0; i < tabs.length; i++) {
            tab = tabs[i];
            if (tab.panel('options').id === id) {
                break;
            }
        }
        if (tab !== null) {
            let curTabIndex = jq.tabs("getTabIndex", tab);
            jq.tabs('select', curTabIndex);
        }
    },
    existsById: function (jq, id) {
        return jq.tabs('getTabById', id) != null;
    }
});

function openTab(jq, id, title, onResize) {
    if (jq.tabs("existsById", id)) {
        jq.tabs("selectById", id);
        return false;
    }
    else {
        jq.tabs('add', {
            id: id,
            title: title,
            closable: true,
            onResize: onResize,
        });
        return true;
    }
}

function selectTab(jq, id) {
    if (jq.tabs("existsById", id)) {
        jq.tabs("selectById", id);
    }
}
