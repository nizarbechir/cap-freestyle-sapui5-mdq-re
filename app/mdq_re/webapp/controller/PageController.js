sap.ui.define([
    "mdq_re/controller/BaseController",
    "mdq_re/controller/ext/EditFlow",
    "mdq_re/controller/ext/MessageHandler",
    "mdq_re/model/formatter",
], function (BaseController, EditFlow, MessageHandler, formatter) {
    "use strict";

    return BaseController.extend("mdq_re.controller.PageController", {

        formatter: formatter,

        // add used extensions
        editFlow: EditFlow,
        messageHandler: MessageHandler,

        onInit: function () {
            const oUIModel = this.getAppComponent().getModel("ui"),
                sPath = `/pages/${this.getView().getId()}`;

            console.log("sPath", sPath);

            // as the model propagation happens after init but we actually 
            // want to access the binding context in the
            // init phase already setting the model here
            this.getView().setModel(oUIModel, "ui");
        },

        onBeforeRendering() {
            /*
            if (this.placeholder.attachHideCallback) {
                this.placeholder.attachHideCallback();
            }
            */
        },

        onPageReady(mParameters) {
            // Apply app state only after the page is ready with the first section selected
            //this.getAppComponent().getAppStateHandler().applyAppState();
        }

    });
});
