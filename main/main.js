import { reactive, watch, get } from "./deps.bundle.js"

globalThis.window = globalThis.window || globalThis
// TODO: eventually replace some of the JSON stringifies with a fast+stable JSON stringify (ordered keys)
    let pageInfoStringified = null
    const getParameters = function(url) {
        pageInfoStringified = `${new URL(url).searchParams.get("_")}` || '{}'
        return JSON.parse(pageInfoStringified)||{}
    }

// 
// intial page data
// 
    const pageInfo = reactive(getParameters(window.location.href))
    let previousPageInfoStringified = pageInfoStringified
    quietlySetPageInfo.ignoreChangesToPageInfo = false
    const goListeners = new Set([])
    const pageInfoChangeListeners = new Set([])
    const specificChangeListeners = new Map()

// 
// helpers
// 
    const addParameters = function(url=window.location.href) {
        // append the parameters
        const urlObject = new URL(url)
        urlObject.searchParams.append('_', pageInfoStringified)
        return `${urlObject}`
    }
    
    // set the value without triggering callbacks
    function quietlySetPageInfo(replacementInfo) {
        // pause the watch function 
        quietlySetPageInfo.ignoreChangesToPageInfo = true
        // delete all the existing data
        for (const [key, value] of Object.entries(pageInfo)) {
            delete pageInfo[key]
        }
        // put the incoming data into the object
        Object.assign(pageInfo, replacementInfo||{})
        pageInfoStringified = JSON.stringify(pageInfo)
        // resume the watch function
        quietlySetPageInfo.ignoreChangesToPageInfo = false
    }
    
    // if data changes, update the URL
    function updateUrl() {
        const urlWithParameters = addParameters(router.config.urlBase)
        // change the url in the top bar to include the new path and parameters
        window.history.replaceState(JSON.parse(pageInfoStringified), '', urlWithParameters)
    }

// 
// 
// callback managers
// 
// 
    function onGo({trigger}) {
        // run the callback
        for (const each of goListeners) {
            each(pageInfo, trigger)
        }
    }

    function onPageInfoChange() {
        // run all the callbacks since the object changed
        for (const each of pageInfoChangeListeners) {
            each(pageInfo)
        }
        // check for specific changes
        if (pageInfoStringified !== previousPageInfoStringified) {
            // get the old one for comparison
            const previousValue = JSON.parse(previousPageInfoStringified)
            // update "previous" for next time
            previousPageInfoStringified = pageInfoStringified
            // create a cache
            const knownChanges = new Map()
            // call specific listeners if specific values changed
            for (const [keyList, callback] of specificChangeListeners) {
                let prevValue
                let newValue
                const memory = knownChanges.get(keyList)
                // if keyList has been computed before
                if (memory) {
                    // if they were confirmed to be the same
                    if (!(memory instanceof Array)) {
                        continue
                    // if they were confirmed to be different
                    } else {
                        prevValue = memory[0]
                        newValue = memory[1]
                    }
                // if keyList has not been done yet
                } else {
                    prevValue = get(previousValue, keyList, undefined)
                    newValue = get(pageInfo, keyList, undefined)
                    // if both are undefined, or the same json string, no-change => continue
                    if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
                        knownChanges.set(keyList, true)
                        continue
                    } else {
                        // otherwise save the change
                        knownChanges.set(keyList, [prevValue, newValue])
                    }
                }
                // if the code got this far, then it needs to run the change callback
                callback(newValue, prevValue)
            }
        }
    }

// 
// 
// Listeners
// 
// 
    // 
    // update the url when pageInfo changes
    // 
    watch(pageInfo, ()=>{
        if (!quietlySetPageInfo.ignoreChangesToPageInfo) {
            pageInfoStringified = JSON.stringify(pageInfo)
            updateUrl()
            onPageInfoChange()
        } else {
            // pageInfoStringified will still get updated at the end of quietlySetPageInfo()
        }
    })

    // 
    // when user presses back/forward, update the pageInfo
    // 
    window.addEventListener("popstate", ({state})=>{
        // change the value
        quietlySetPageInfo(state)
        // manually trigger info change callbacks
        onPageInfoChange()
        // run all the callbacks to let them know something changed
        onGo({trigger:'popstate'})
    })


// 
// 
// export
// 
// 
const router = {
    config: {
        get urlBase() {
            return window.location.href.split(/(\?|#)/g)[0]
        }
    },
    goTo(object) {
        // first update the pageInfo 
        quietlySetPageInfo(object)
        // then generate the new url
        const urlWithParameters = addParameters(router.config.urlBase)
        const args = [JSON.parse(JSON.stringify(pageInfo)), "", urlWithParameters]
        // push the change onto history
        window.history.pushState(...args)
        // tell things that the value changed
        onPageInfoChange()
        // run all the go callbacks
        onGo({trigger:'goTo'})
    },
    goSecretlyTo(object) {
        // quitely is to save processing power if there are a lot of keys/values
        quietlySetPageInfo(object)
        // update url once instead of once per key-value
        updateUrl()
        // the page info still changed, so run that callback
        onPageInfoChange()
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
        } else if (type instanceof Array) {
            specificChangeListeners.set(type, listener)
        }
    },
    removeEventListener(type, listener) {
        if (type == "go") {
            goListeners.remove(listener)
        } else if (type == "allChanges") {
            pageInfoChangeListeners.remove(listener)
        } else if (type instanceof Array) {
            specificChangeListeners.remove(type, listener)
        }
    },
}

export default router