


declare var module: { exports: string };
declare var require: (name: string) => {};
declare function define(): void;
declare namespace define { export var amd: string; }


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
    define(['jquery'], function ($: any) {
        return (function () {

            function noOp() { }

            interface Response {
                toastId: number,
                state: string,
                startTime: Date,
                endTime: Date | null,
                options: any,
                map: any
            }

            interface NotifyOptionsMap {
                type: string,
                iconClass: string,
                message: string,
                optionsOverride: any,
                title: string
            }

            interface ProgressBar {
                intervalId: number | null,
                hideEta: number | null,
                maxHideTime?: number | null
            }

            interface AnimateOptions {
                easing: string | boolean,
                duration: number | boolean,
                complete: { (evt?: MouseEvent): void } | null
            }

            interface ToastrOptions {
                tapToDismiss: boolean,
                toastClass: string,
                containerId: string,
                debug: boolean,

                showMethod: string,
                showDuration: number | boolean,
                showEasing: string | boolean,
                onShown: {
                    (evt?: MouseEvent)
                        : void
                } | null,
                hideMethod: string,
                hideDuration: number | boolean,
                hideEasing: string | boolean,
                onHidden: { (evt?: MouseEvent): void } | null,
                closeMethod: string | boolean,
                closeDuration: number | boolean,
                closeEasing: string | boolean,
                closeOnHover: boolean,
                closeButton: boolean,

                onCloseClick: { (evt?: MouseEvent): void } | null,
                onclick: { (evt?: MouseEvent): void } | null,

                extendedTimeOut: number,
                iconClasses: {
                    error: 'toast-error',
                    info: 'toast-info',
                    success: 'toast-success',
                    warning: 'toast-warning'
                };
                iconClass: string,
                positionClass: string,
                timeOut: number,
                titleClass: string,
                messageClass: string
                escapeHtml: boolean,
                target: string,
                closeHtml: string,
                closeClass: string,
                newestOnTop: boolean,
                preventDuplicates: boolean,
                progressBar: boolean,
                progressClass: string,
                rtl: boolean
            }

            var listener: { (...args: any[]): void } | null = null;
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

            var previousToast: string | null;

            return toastr;

            ////////////////

            function throwException<T>(message: string): T {
                throw new Error(message);
            }

            function getElementFromSelector(selector: string): HTMLElement | null {
                // return a single element from a jQuery-like selector
                if (selector.startsWith("#")) {
                    return document.getElementById(selector.slice(1));
                } else if (selector.startsWith(".")) {
                    return <HTMLElement>document.getElementsByClassName(selector.slice(1))[0];
                } else if (selector.startsWith("<")) {
                    return createElementFromHtml(selector);
                } else {
                    return <HTMLElement>document.getElementsByTagName(selector)[0];
                }
            }

            function createElementFromHtml(html: string): HTMLElement {
                var element = document.createElement("div");
                element.innerHTML = html;
                return <HTMLElement>element.firstChild;
            }

            function elementIsVisible(element: HTMLElement): boolean {
                return !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
            }

            function elementOnHover(element: HTMLElement, mouseOver: () => void, mouseOut: () => void): void {
                element.addEventListener('mouseover', mouseOver);
                element.addEventListener('mouseout', mouseOut);
            }

            function elementHasFocus(element: HTMLElement): boolean {
                return element === document.activeElement;
            }

            function callAnimateMethod(element: HTMLElement, method: string, animateOptions: AnimateOptions): void {
                $(element)[method](animateOptions);
            }

            function error(message: string, title: string, optionsOverride: any) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function getContainer(options?: any, create?: boolean): HTMLElement | null {
                if (!options) { options = getOptions(); }
                var container = document.getElementById(options.containerId);
                if (container) {
                    return container;
                }
                if (create) {
                    container = createContainer(options);
                }

                return container;
            }

            function info(message: string, title: string, optionsOverride: {}) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function subscribe(callback: { (...args: any[]): void }) {
                listener = callback;
            }

            function success(message: string, title: string, optionsOverride: {}) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function warning(message: string, title: string, optionsOverride: {}) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function clear($toastElement: JQuery | HTMLElement, clearOptions: any) {
                var options = getOptions();
                var element = getElementFromArgument($toastElement);
                if (!clearToast(element, options, clearOptions)) {
                    var container = getContainer(options);
                    clearContainer(container, options);
                }
            }

            function isJQueryObject(obj: JQuery | HTMLElement): obj is JQuery {
                return obj instanceof jQuery;
            }

            function getElementFromArgument(obj: JQuery | HTMLElement): HTMLElement {
                if (isJQueryObject(obj)) {
                    return obj[0];
                } else {
                    return obj;
                }
            }
            function remove($toastElement: JQuery | HTMLElement) {
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

            function clearContainer($container: HTMLElement | null, options: any) {
                if (!$container) return;
                var toastsToClear = $container.children;
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast(<HTMLElement>toastsToClear[i], options);
                }
            }

            function clearToast($toastElement: HTMLElement, options?: any, clearOptions?: any): boolean {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || !elementHasFocus($toastElement))) {
                    callAnimateMethod($toastElement, options.hideMethod, {
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    })

                    return true;
                }
                return false;
            }

            function createContainer(options: { containerId: string, positionClass: string, target: string }) {
                var container = document.createElement("div");
                container.setAttribute("id", options.containerId);
                container.classList.add(options.positionClass);

                var target = getElementFromSelector(options.target) || throwException<HTMLElement>("Container parent could not be located.");
                target.appendChild(container);
                return container;
            }

            function getDefaults(): ToastrOptions {
                return {
                    tapToDismiss: true,
                    toastClass: 'toast',
                    containerId: 'toast-container',
                    debug: false,

                    showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                    showDuration: 300,
                    showEasing: 'swing', //swing and linear are built into jQuery
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
                    timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
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
                }
            }

            function publish(args: any): void {
                if (!listener) { return; }
                listener(args);
            }

            function notify(map: NotifyOptionsMap): HTMLElement | null {
                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;

                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = Object.assign(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }

                if (shouldExit(options, map)) { return null; }

                toastId++;

                var $container = getContainer(options, true) || throwException<HTMLElement>("getContainer returned null instead of creating container");

                var intervalId: number | null = null;
                var $toastElement: HTMLElement = document.createElement('div');
                var $titleElement: HTMLElement = document.createElement('div');
                var $messageElement: HTMLElement = document.createElement('div');
                var $progressElement: HTMLElement = document.createElement('div');
                var $closeElement: HTMLElement | null = getElementFromSelector(options.closeHtml);
                var progressBar: ProgressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };

                var response: Response = {
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

                function escapeHtml(source: string) {
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

                function personalizeToast(): void {
                    setIcon();
                    setTitle();
                    setMessage();
                    setCloseButton();
                    setProgressBar();
                    setRTL();
                    setSequence();
                    setAria();
                }

                function setAria(): void {
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

                function handleEvents(): void {
                    if (options.closeOnHover) {
                        elementOnHover($toastElement, stickAround, delayedHideToast);
                    }

                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.onclick = (ev: MouseEvent) => hideToast(false);
                    }

                    if (options.closeButton && $closeElement) {
                        $closeElement.onclick = (function (event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
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

                function displayToast(): void {
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

                function setIcon(): void {
                    if (map.iconClass) {
                        $toastElement.classList.add(options.toastClass);
                        $toastElement.classList.add(iconClass);
                    }
                }

                function setSequence(): void {
                    if (options.newestOnTop) {
                        $container.insertBefore($toastElement, $container.firstChild);
                    } else {
                        $container.appendChild($toastElement);
                    }
                }

                function setTitle(): void {
                    if (map.title) {
                        var suffix = map.title;
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.title);
                        }

                        //var suffixNode = createElementFromHtml(suffix);
                        //$titleElement.appendChild(suffixNode);

                        $titleElement.innerHTML = suffix;

                        $titleElement.classList.add(options.titleClass);
                        $toastElement.appendChild($titleElement);
                    }
                }

                function setMessage(): void {
                    if (map.message) {
                        var suffix = map.message;
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.message);
                        }

                        //var suffixNode = createElementFromHtml(suffix);
                        //$messageElement.appendChild(suffixNode);

                        $messageElement.innerHTML = suffix;
                        $messageElement.classList.add(options.messageClass);
                        $toastElement.appendChild($messageElement);
                    }
                }

                function setCloseButton(): void {
                    if (options.closeButton && $closeElement) {
                        $closeElement.classList.add(options.closeClass);
                        $closeElement.setAttribute("role", "button");
                        $toastElement.insertBefore($closeElement, $toastElement.firstChild);
                    }
                }

                function setProgressBar(): void {
                    if (options.progressBar) {
                        $progressElement.classList.add(options.progressClass);
                        $toastElement.insertBefore($progressElement, $toastElement.firstChild);
                    }
                }

                function setRTL(): void {
                    if (options.rtl) {
                        $toastElement.classList.add('rtl');
                    }
                }

                function shouldExit(options: ToastrOptions, map: NotifyOptionsMap): boolean {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        } else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }

                function hideToast(override: boolean): any {
                    var method: string = override && options.closeMethod !== false ? options.closeMethod.toString() : options.hideMethod;
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

                function delayedHideToast(): void {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut.toString());
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }

                function stickAround(): void {
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

                function updateProgress(): void {
                    var hideEta = progressBar.hideEta || 0;
                    var maxHideTime = progressBar.maxHideTime || 0;

                    var percentage = ((hideEta - (new Date().getTime())) / maxHideTime) * 100;
                    var progressHtmlElement = <HTMLElement>$progressElement;
                    progressHtmlElement.style.width = percentage + '%';
                }
            }

            function getOptions(): ToastrOptions {
                var result = getDefaults();
                return Object.assign(result, toastr.options);
            }

            function removeToast($toastElement: HTMLElement | null): void {
                if (!$toastElement) return;
                if (elementIsVisible($toastElement)) return;

                var $container = getContainer();
                if (!$container) return;

                $toastElement.remove();
                $toastElement = null;

                if ($container.childElementCount === 0) {
                    $container.remove();
                    previousToast = null;
                }
            }

        })();
    });
}(typeof define === 'function' && define.amd ? define : function (deps: any, factory: any) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'));
    } else {
        window.toastr = factory(window.jQuery);
    }
}));
