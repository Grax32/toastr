"use strict";
/*
 * Toastr
 * Copyright 2012-2015
 * Authors: John Papa, Hans Fjällemark, and Tim Ferrell.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * ARIA Support: Greta Krafsig
 *
 * Project: https://github.com/CodeSeven/toastr
 */
/* global define */
(function (define) {
    define(['jquery'], function ($) {
        return (function () {
            function noOp() { }
            var listener = null;
            var toastId = 0;
            var toastType = {
                error: 'error',
                info: 'info',
                success: 'success',
                warning: 'warning'
            };
            var toastr = {
                clear: clear,
                remove: remove,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                subscribe: subscribe,
                success: success,
                version: '2.1.4',
                warning: warning
            };
            var previousToast;
            return toastr;
            ////////////////
            function throwException(message) {
                throw new Error(message);
            }
            function getElementFromSelector(selector) {
                // return a single element from a jQuery-like selector
                if (selector.startsWith("#")) {
                    return document.getElementById(selector.slice(1));
                }
                else if (selector.startsWith(".")) {
                    return document.getElementsByClassName(selector.slice(1))[0];
                }
                else if (selector.startsWith("<")) {
                    return createElementFromHtml(selector);
                }
                else {
                    return document.getElementsByTagName(selector)[0];
                }
            }
            function createElementFromHtml(html) {
                var element = document.createElement("div");
                element.innerHTML = html;
                return element.firstChild;
            }
            function elementIsVisible(element) {
                return !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
            }
            function elementOnHover(element, mouseOver, mouseOut) {
                element.addEventListener('mouseover', mouseOver);
                element.addEventListener('mouseout', mouseOut);
            }
            function elementHasFocus(element) {
                return element === document.activeElement;
            }
            function callAnimateMethod(element, method, animateOptions) {
                $(element)[method](animateOptions);
            }
            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function getContainer(options, create) {
                if (!options) {
                    options = getOptions();
                }
                var container = document.getElementById(options.containerId);
                if (container) {
                    return container;
                }
                if (create) {
                    container = createContainer(options);
                }
                return container;
            }
            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function subscribe(callback) {
                listener = callback;
            }
            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function clear($toastElement, clearOptions) {
                var options = getOptions();
                var element = getElementFromArgument($toastElement);
                if (!clearToast(element, options, clearOptions)) {
                    var container = getContainer(options);
                    clearContainer(container, options);
                }
            }
            function isJQueryObject(obj) {
                return obj instanceof jQuery;
            }
            function getElementFromArgument(obj) {
                if (isJQueryObject(obj)) {
                    return obj[0];
                }
                else {
                    return obj;
                }
            }
            function remove($toastElement) {
                var options = getOptions();
                var element = getElementFromArgument($toastElement);
                if (element.id === document.activeElement.id) {
                    removeToast(element);
                    return;
                }
                var container = getContainer(options);
                if (container && container.childElementCount) {
                    container.remove();
                }
            }
            // internal functions
            function clearContainer($container, options) {
                if (!$container)
                    return;
                var toastsToClear = $container.children;
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast(toastsToClear[i], options);
                }
            }
            function clearToast($toastElement, options, clearOptions) {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || !elementHasFocus($toastElement))) {
                    callAnimateMethod($toastElement, options.hideMethod, {
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    });
                    return true;
                }
                return false;
            }
            function createContainer(options) {
                var container = document.createElement("div");
                container.setAttribute("id", options.containerId);
                container.classList.add(options.positionClass);
                var target = getElementFromSelector(options.target) || throwException("Container parent could not be located.");
                target.appendChild(container);
                return container;
            }
            function getDefaults() {
                return {
                    tapToDismiss: true,
                    toastClass: 'toast',
                    containerId: 'toast-container',
                    debug: false,
                    showMethod: 'fadeIn',
                    showDuration: 300,
                    showEasing: 'swing',
                    onShown: () => { },
                    hideMethod: 'fadeOut',
                    hideDuration: 1000,
                    hideEasing: 'swing',
                    onHidden: () => { },
                    closeMethod: false,
                    closeDuration: false,
                    closeEasing: false,
                    closeOnHover: true,
                    closeButton: false,
                    onCloseClick: () => { },
                    onclick: () => { },
                    extendedTimeOut: 1000,
                    iconClasses: {
                        error: 'toast-error',
                        info: 'toast-info',
                        success: 'toast-success',
                        warning: 'toast-warning'
                    },
                    iconClass: 'toast-info',
                    positionClass: 'toast-top-right',
                    timeOut: 5000,
                    titleClass: 'toast-title',
                    messageClass: 'toast-message',
                    escapeHtml: false,
                    target: 'body',
                    closeHtml: '<button type="button">&times;</button>',
                    closeClass: 'toast-close-button',
                    newestOnTop: true,
                    preventDuplicates: false,
                    progressBar: false,
                    progressClass: 'toast-progress',
                    rtl: false
                };
            }
            function publish(args) {
                if (!listener) {
                    return;
                }
                listener(args);
            }
            function notify(map) {
                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;
                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = Object.assign(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }
                if (shouldExit(options, map)) {
                    return null;
                }
                toastId++;
                var $container = getContainer(options, true) || throwException("getContainer returned null instead of creating container");
                var intervalId = null;
                var $toastElement = document.createElement('div');
                var $titleElement = document.createElement('div');
                var $messageElement = document.createElement('div');
                var $progressElement = document.createElement('div');
                var $closeElement = getElementFromSelector(options.closeHtml);
                var progressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };
                var response = {
                    toastId: toastId,
                    state: 'visible',
                    startTime: new Date(),
                    endTime: null,
                    options: options,
                    map: map
                };
                personalizeToast();
                displayToast();
                handleEvents();
                publish(response);
                if (options.debug && console) {
                    console.log(response);
                }
                return $toastElement;
                function escapeHtml(source) {
                    if (source == null) {
                        source = '';
                    }
                    return source
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }
                function personalizeToast() {
                    setIcon();
                    setTitle();
                    setMessage();
                    setCloseButton();
                    setProgressBar();
                    setRTL();
                    setSequence();
                    setAria();
                }
                function setAria() {
                    var ariaValue = '';
                    switch (map.iconClass) {
                        case 'toast-success':
                        case 'toast-info':
                            ariaValue = 'polite';
                            break;
                        default:
                            ariaValue = 'assertive';
                    }
                    $toastElement.setAttribute('aria-live', ariaValue);
                }
                function handleEvents() {
                    if (options.closeOnHover) {
                        elementOnHover($toastElement, stickAround, delayedHideToast);
                    }
                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.onclick = (ev) => hideToast(false);
                    }
                    if (options.closeButton && $closeElement) {
                        $closeElement.onclick = (function (event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            }
                            else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                                event.cancelBubble = true;
                            }
                            if (options.onCloseClick) {
                                options.onCloseClick(event);
                            }
                            hideToast(true);
                        });
                    }
                    if (options.onclick) {
                        var optionsOnClick = options.onclick;
                        $toastElement.onclick = function (event) {
                            optionsOnClick(event);
                            hideToast(false);
                        };
                    }
                }
                function displayToast() {
                    $toastElement.style.display = "none";
                    callAnimateMethod($toastElement, options.showMethod, {
                        duration: options.showDuration,
                        easing: options.showEasing,
                        complete: options.onShown
                    });
                    if (options.timeOut > 0) {
                        intervalId = setTimeout(hideToast, options.timeOut);
                        progressBar.maxHideTime = parseFloat(options.timeOut.toString());
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                        if (options.progressBar) {
                            progressBar.intervalId = setInterval(updateProgress, 10);
                        }
                    }
                }
                function setIcon() {
                    if (map.iconClass) {
                        $toastElement.classList.add(options.toastClass);
                        $toastElement.classList.add(iconClass);
                    }
                }
                function setSequence() {
                    if (options.newestOnTop) {
                        $container.insertBefore($toastElement, $container.firstChild);
                    }
                    else {
                        $container.appendChild($toastElement);
                    }
                }
                function setTitle() {
                    if (map.title) {
                        var suffix = map.title;
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.title);
                        }
                        var suffixNode = createElementFromHtml(suffix);
                        $titleElement.appendChild(suffixNode);
                        $titleElement.classList.add(options.titleClass);
                        $toastElement.appendChild($titleElement);
                    }
                }
                function setMessage() {
                    if (map.message) {
                        var suffix = map.message;
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.message);
                        }
                        var suffixNode = createElementFromHtml(suffix);
                        $messageElement.appendChild(suffixNode);
                        $messageElement.classList.add(options.messageClass);
                        $toastElement.appendChild($messageElement);
                    }
                }
                function setCloseButton() {
                    if (options.closeButton && $closeElement) {
                        $closeElement.classList.add(options.closeClass);
                        $closeElement.setAttribute("role", "button");
                        $toastElement.insertBefore($closeElement, $toastElement.firstChild);
                    }
                }
                function setProgressBar() {
                    if (options.progressBar) {
                        $progressElement.classList.add(options.progressClass);
                        $toastElement.insertBefore($progressElement, $toastElement.firstChild);
                    }
                }
                function setRTL() {
                    if (options.rtl) {
                        $toastElement.classList.add('rtl');
                    }
                }
                function shouldExit(options, map) {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        }
                        else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }
                function hideToast(override) {
                    var method = override && options.closeMethod !== false ? options.closeMethod.toString() : options.hideMethod;
                    var duration = override && options.closeDuration !== false ?
                        options.closeDuration : options.hideDuration;
                    var easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
                    if (elementHasFocus($toastElement) && !override) {
                        return;
                    }
                    clearTimeout(progressBar.intervalId || 0);
                    //return $toastElement[method]({
                    return callAnimateMethod($toastElement, method, {
                        duration: duration,
                        easing: easing,
                        complete: function () {
                            removeToast($toastElement);
                            clearTimeout(intervalId || 0);
                            if (options.onHidden && response.state !== 'hidden') {
                                options.onHidden();
                            }
                            response.state = 'hidden';
                            response.endTime = new Date();
                            publish(response);
                        }
                    });
                }
                function delayedHideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut.toString());
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }
                function stickAround() {
                    clearTimeout(intervalId || 0);
                    progressBar.hideEta = 0;
                    callAnimateMethod($toastElement, "stop", {
                        duration: options.showDuration,
                        easing: options.showEasing,
                        complete: null
                    });
                    //$toastElement.stop(true, true)[options.showMethod](
                    //    { duration: options.showDuration, easing: options.showEasing }
                    //);
                }
                function updateProgress() {
                    var hideEta = progressBar.hideEta || 0;
                    var maxHideTime = progressBar.maxHideTime || 0;
                    var percentage = ((hideEta - (new Date().getTime())) / maxHideTime) * 100;
                    var progressHtmlElement = $progressElement;
                    progressHtmlElement.style.width = percentage + '%';
                }
            }
            function getOptions() {
                var result = getDefaults();
                return Object.assign(result, toastr.options);
            }
            function removeToast($toastElement) {
                if (!$toastElement)
                    return;
                if (elementIsVisible($toastElement))
                    return;
                var $container = getContainer();
                if (!$container)
                    return;
                $toastElement.remove();
                $toastElement = null;
                if ($container.childElementCount === 0) {
                    $container.remove();
                    previousToast = null;
                }
            }
        })();
    });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('jquery'));
    }
    else {
        window.toastr = factory(window.jQuery);
    }
}));
