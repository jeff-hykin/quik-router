const { reactive } = require("@vue/reactivity")
const { watch } = require("@vue-reactivity/watch")

// 
// helpers
// 
const getParameters = function(url) {
    return JSON.parse(`${new URL(url).searchParams.get("_")}`) || {}
}
const addParameters = function(url=window.location.href) {
    // append the parameters
    const urlObject = new URL(url)
    urlObject.searchParams.append('_', JSON.stringify(pageInfo))
    return `${urlObject}`
}

// 
// intial page data
// 
const pageInfo = reactive(getParameters(window.location.href))
let ignoreChangesToPageInfo = false
const goListeners = new Set([])
const pageInfoChangeListeners = new Set([])
function onGo() {
    // run the callback
    for (const each of goListeners) {
        each(pageInfo)
    }
}
function onPageInfoChange() {
    // run all the callbacks since the object changed
    for (const each of pageInfoChangeListeners) {
        each()
    }
}
function quietlySetPageInfo(replacementInfo) {
    // pause the watch function 
    ignoreChangesToPageInfo = true
    // delete all the existing data
    for (const [key, value] of Object.entries(pageInfo)) {
        delete pageInfo[key]
    }
    // put the incoming data into the object
    Object.assign(pageInfo, replacementInfo||{})
    // resume the watch function
    ignoreChangesToPageInfo = false
    onPageInfoChange()
}

// 
// whenever the pageInfo is updated, update the URL
// 
function updateUrl() {
    const urlWithParameters = addParameters(window.location.origin)
    // change the url in the top bar to include the new path and parameters
    window.history.replaceState(JSON.parse(JSON.stringify(pageInfo)), '', urlWithParameters)
}
// update the url when pageInfo changes
watch(pageInfo, ()=>{
    if (!ignoreChangesToPageInfo) {
        updateUrl()
        onPageInfoChange()
    }
})

// 
// when user presses back/forward, update the pageInfo
// 
window.addEventListener("popstate", ({state})=>{
    // change the value
    quietlySetPageInfo(state)
    // run all the callbacks to let them know something changed
    onGo()
})

module.exports = {
    goTo(object) {
        // first update the pageInfo 
        quietlySetPageInfo(object)
        // then generate the new url
        const urlWithParameters = addParameters(window.location.origin)
        // push the change onto history
        window.history.pushState(JSON.parse(JSON.stringify(pageInfo)), '', urlWithParameters)
        // run all the callbacks
        onGo()
    },
    goSecretlyTo(object) {
        // quitely is to save processing power if there are a lot of keys/values
        quietlySetPageInfo(object)
        // update url once instead of once per key-value
        updateUrl()
    },
    goBack() {
        // this will automaticall call the "popstate" listener,
        // which will set the pageInfo and callbacks accordingly
        window.history.back()
    },
    pageInfo,
    addEventListener(type, listener) {
        if (type == "go") {
            goListeners.add(listener)
        } else if (type == "allChanges") {
            pageInfoChangeListeners.add(listener)
        }
    },
    removeEventListener(type, listener) {
        if (type == "go") {
            goListeners.remove(listener)
        } else if (type == "allChanges") {
            pageInfoChangeListeners.remove(listener)
        }
    },
}