sap.ui.define([
    "mdq_re/controller/PageController",
    "mdq_re/controller/ext/EditFlow",
    "mdq_re/controller/ext/MessageHandler",
    "mdq_re/controller/ext/FileViewer",
    "mdq_re/controller/ext/AnnotationHelper",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/library'
], function (PageController, EditFlow, MessageHandler, FileViewer, AnnotationHelper, JSONModel,
    coreLibrary) {
    "use strict";
    var ValueState = coreLibrary.ValueState;

    return PageController.extend("mdq_re.controller.ObjectPage", {

        // add used extensions
        editFlow: EditFlow,
        messageHandler: MessageHandler,
        fileViewer: FileViewer,
        annotationHelper: AnnotationHelper,

        onInit: function () {
            var iOriginalBusyDelay;

            // Store original busy indicator delay, so it can be restored later on
            iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

            // local view model
            var oViewModel = new JSONModel({
                itemCount: 0,
                actionsCount: 0,
                attachmentCount: 0,
                pdfSource: "",
                pdfTitle: "",
            })
            this.getView().setModel(oViewModel, "view");
            this._oViewModel = oViewModel;

            // site view
            this._oDynamicSideView = this.byId("DynamicSideContent");

            // handle current route
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

        },

        onAfterRendering: function () {
            this._sCurrentBreakpoint = this._oDynamicSideView.getCurrentBreakpoint();
        },

        onFileOpenBySide: function (oEvent) {
            var oSource = oEvent.getSource(),
                oList = oSource.getList(),
                oItem = (oEvent.getParameter("items"))
                    ? oEvent.getParameter("items")[0]
                    : oList.getSelectedItem(),
                oContext = oItem.getBindingContext();

            if (oContext.getProperty("MediaType") === "application/pdf") {
                this._oDynamicSideView.setShowSideContent(true);
                this._oViewModel.setProperty("/pdfSource", oContext.getProperty("Url"));
                this._oViewModel.setProperty("/pdfTitle", oContext.getProperty("FileName"));
            } else {
                this.fileViewer.onAvatarPress.apply(this, arguments);
            }

            // deselect litem items
            oList.removeSelections();
        },

        onItemUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            this._oViewModel.setProperty("/itemCount", iTotal);
        },

        onActionsUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            this._oViewModel.setProperty("/actionsCount", iTotal);
        },

        onAttachmentUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            this._oViewModel.setProperty("/attachmentCount", iTotal);
        },

        onEditFlowBeforeSave: function (mParameters) {
            return Promise.reject("not confirmed by user");
        },

        onAddItem: function (oEvent) {
            this._addItem(oEvent);
        },

        onDeleteItem: function (oEvent) {
            var oList = oEvent.getSource(),
                oItem = oEvent.getParameter("listItem"),
                oContext = oItem.getBindingContext();

            // after deletion put the focus back to the list
            oList.attachEventOnce("updateFinished", oList.focus, oList);

            // send a delete request to the odata service
            oContext.delete();
        },

        onSideContentClose: function () {
            if (this._sCurrentBreakpoint === "S") {
                this._oDynamicSideView.toggle();
            } else {
                this._oDynamicSideView.setShowSideContent(false);
            }
        },

        onSideContentBreakpointChanged: function (oEvent) {
            return;
            this._sCurrentBreakpoint = oEvent.getParameter("currentBreakpoint");

            var oButton = this.byId("SideContentToggleButton");
            if (this._sCurrentBreakpoint === "S" || !this._oDynamicSideView.isSideContentVisible()) {
                oButton.setVisible(true);
            } else {
                oButton.setVisible(false);
            }
        },

        onSideContentToggle: function (oEvent) {
            if (this._sCurrentBreakpoint === "S") {
                this._oDynamicSideView.toggle();
            } else {
                this._oDynamicSideView.setShowSideContent(true);
            }

            //this.byId("SideContentToggleButton").setVisible(false);

            this.byId("SideContentCloseButton").focus();
        },

        onEditPress: function (oEvent) {
            var oView = this.getView(),
                oViewModel = oView.getModel("ui");

            oViewModel.setProperty("/isEditable", true);
        },

        _onObjectMatched: function (oEvent) {
            var sKey = oEvent.getParameter("arguments").objectId,
                sObjectPath;

            if (sKey === "...") {
                // create (edit mode)
                //this.getView().attachEventOnce("afterRendering", function() {}, this);

                sObjectPath = sKey;

                // focus first editable field
                this.byId("SmartForm").setFocusOnEditableControl();
            } else {
                // display mode
                sObjectPath = "/" + this.getModel().createKey("Rule", {
                    ID: sKey
                });
            }

            this._bindView(sObjectPath);
        },

        /**
        * Binds the view to the object path. Makes sure that detail view displays
        * a busy indicator while data for the corresponding element binding is loaded.
        * @function
        * @param {string} sPath path to the object to be bound to the view.
        * @param {object} mParameters binding params
        * @private
        */
        _bindView: function (sPath) {
            var oView = this.getView(),
                oViewModel = oView.getModel("ui"),
                oDataModel = this.getModel(),
                oEditArea = this.byId("ObjectPageLayout"),
                bEditable = sPath === "...";

            // remove former binding
            oView.unbindElement();
            //oEditArea.unbindElement();

            // EDIT/DISPLAY MODE
            this.getAppComponent().setEditable(bEditable);

            // hide side content
            this._oDynamicSideView.setShowSideContent(false);

            if (bEditable) {
                // create transient context for root entity (sales order)
                // and bind context to view
                var oEditContext = this.editFlow.createDocument("/Rule", {
                    description: "Rule number _" + Math.floor(Math.random() * 100),
                    errorDescription: "The record(s) should be complaint to aspect _" + Math.floor(Math.random() * 10000),
                    priority: "High",
                    errorType: "Error",
                    isActive: true
                });

                //oEditArea.setBindingContext(oEditContext);
                oView.setBindingContext(oEditContext);

                oViewModel.setProperty("/busy", false);
            } else {
                oView.bindElement({
                    path: sPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oDataModel.metadataLoaded().then(function () {
                                // Busy indicator on view should only be set if metadata is loaded,
                                // otherwise there may be two busy indications next to each other on the
                                // screen. This happens because route matched handler already calls '_bindView'
                                // while metadata is loaded.
                                oViewModel.setProperty("/busy", true);
                            });
                        },
                        dataReceived: function () {
                            oViewModel.setProperty("/busy", false);
                        }
                    }
                });
            }
        },

        /**
         * Event handler for binding change event
         * @function
         * @private
         */
        _onBindingChange: function (oEvent) {
            var oView = this.getView(),
                //oElementBinding = oView.getElementBinding(),
                oViewModel = this.getView().getModel("ui");

            // No data for the binding
            if (!oView.getBindingContext()) {
                //if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            // Everything went fine.
            oViewModel.setProperty("/busy", false);
        },

        _addItem: function (oEvent, oDefaultData) {
            var oSmartTable = this.byId("smartTableItems"),
                oTable = (oSmartTable) ? oSmartTable.getTable() : oEvent.getSource().getParent().getParent(),
                oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            var oData = {
                operator_name: "EQ"
            };

            if (oDefaultData) {
                oData = Object.assign(oDefaultData, oData);
            }

            // after adding put the focus on the newly create item
            oTable.attachEventOnce("updateFinished", function () {
                var aItems = oTable.getItems(),
                    oItem = aItems[aItems.length - 1];

                if (oItem) {
                    oItem.focus();
                }
            }, oTable);

            // create transient context for subentity (sales order line item) 
            oBinding.create(oData, true); // insert at end                        
        },
        handleChangeElement: function (oEvent) {
            var oValidatedComboBox = oEvent.getSource(),
                sSelectedKey = oValidatedComboBox.getSelectedKey(),
                sValue = oValidatedComboBox.getValue(),
                oSelectedElement = oValidatedComboBox.getSelectedItem().getBindingContext().getObject(),
                mainRule = this.getView().getBindingContext().getObject();


            if ((!sSelectedKey && sValue) || (mainRule.entity_name !== oSelectedElement.parent_name)) {
                oValidatedComboBox.setValueState(ValueState.Error);
                oValidatedComboBox.setValueStateText("Attribute must belong to the Rule's Entity");
            } else {
                oValidatedComboBox.setValueState(ValueState.None);
            }
        },

        // In your SAPUI5 controller
        checkRuleViolations: function () {
            var oModel = this.getView().getModel();
            var oContext = this.getView().getBindingContext();
            var mainRule = oContext.getObject();
        
            var sRuleID = mainRule.ID;
        
            oModel.callFunction("/checkRuleViolations", {
                method: "POST",
                urlParameters: { ruleID: sRuleID },
                success: function (oData, response) {
                    sap.m.MessageToast.show("Rule violations updated successfully.");
                    // Refresh only this binding context to update the UI
                    oModel.refresh(true);
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Error updating rule violations.");
                    console.error("Error in checkRuleViolations call:", oError);
                }
            });
        }


    });
});
