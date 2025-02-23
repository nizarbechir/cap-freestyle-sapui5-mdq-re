sap.ui.define([
    "udina/sample/mdq_re/controller/PageController",
    "sap/ui/generic/app/navigation/service/NavigationHandler",
    "sap/ui/model/Sorter"
], function (PageController, NavigationHandler, Sorter) {
    "use strict";

    return PageController.extend("udina.sample.mdq_re.controller.ListReport", {

        onInit: function () {
            // shortcut
            this._oSmartFilterBar = this.byId("smartFilterBar");
            this._oSmartTable = this.byId("smartTable");

            // Restoring Fiori Application State (see John Patterson blog)
            // https://blogs.sap.com/2017/06/19/restoring-fiori-application-state/

            // create an instance of the navigation handler
            this.oNavigationHandler = new NavigationHandler(this);

            // on back navigation, the previous app state is returned in the resolved Promise
            this.oNavigationHandler.parseNavigation().done(this.onNavigationDone.bind(this));

            // keeps the app state
            this._oAppState = {
                selectedTabFilter: "all",
                searchText: "",
                selectedContextPaths: [],
                // collect filter
                selectedOrderTypes: [],
            };
        },

        onBeforeRebindTable: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams"),
                aFilters = mBindingParams.filters,
                aSorter = mBindingParams.sorter,
                oParameters = mBindingParams.parameters,
                sSearch = (oParameters && oParameters.custom) ? oParameters.custom.search : null;

            // Sort annotation is not taken intro account by SmartTable!!!
            // handle manifest default dynamic sorter if no sort order is given
            if (aSorter.length <= 0) {
                aSorter.push(new Sorter("description", true));
            }

            //console.log("onBeforeRebindTable", mBindingParams);
        },

        onNotFound: function () {
            this.getRouter().getTargets().display("notFound", {
                fromTarget: "list"
            });
        },

        onAdd: function () {
            this.getRouter().navTo("object", {
                objectId: "..." // -> key placeholder from sap.fe
            });
        },

        onRefresh: function () {
            this.byId("list").getBinding("items").refresh();
        },

        onSearch: function (oEvent) {
            var oSearchControl = oEvent.getSource().getBasicSearchControl(),
                sQuery = oSearchControl.getValue(),
                aParameters = oEvent.getParameters(),
                bFilterBarEvent = (aParameters) ? aParameters[0].firedFromFilterBar : undefined,
                aSelectionSet = (aParameters) ? aParameters[0].selectionSet : undefined;

            this._oAppState.searchText = sQuery;
            // this._applyFilters(aSelectionSet);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onItemPress: function (oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            //oTable = this._oSmartTable.getTable();

            // save table selection to appState
            this._oAppState.selectedContextPaths = [oListItem.getBindingContext().getPath()];
            //this._oAppState.selectedContextPaths = oTable.getSelectedContextPaths();                        

            // The source is the list item that got pressed
            this._showObject(oListItem);
        },

        onCrossAppNavigation: function () {
            //(sSemanticObject, sActionName, vParameters?, oAppData?, fnError?)
            this.oNavigationHandler.navigate("UDINATest", "display", {}, { customData: this._oAppState }, undefined);
        },

        /**
         * if navigated back with appstate enabled then rehydrate the page using the
         * stored data
         * @param {Object} oAppData data persisted via iAppState
         * @param {Object} oURLParameters paramters passed in
         * @param {String} sNavType type of navigation
         */
        onNavigationDone: function (oAppData, oURLParameters, sNavType) {
            switch (sNavType) {
                case "initial":
                    break;
                case "iAppState":
                    this._oAppState = oAppData.customData;
                    console.log("onNavigationDone", this._oAppState);
                    /*
                    // set the previously selected icon filter tab
                    this.byId("iconTabBar").setSelectedKey(this._oAppState.selectedTabFilter);

                    // apply previous filters to table
                    this._applyFilters();

                    // set the previous search state
                    this.byId("searchField").setValue(this._oAppState.searchText);

                    // set the previously selected multi combo tokens
                    this.byId("categories").setSelectedKeys(this._oAppState.selectedCategories);
                    this.byId("suppliers").setSelectedKeys(this._oAppState.selectedSuppliers);

                    // select previously selected rows
                    this.byId("table").setSelectedContextPaths(this._oAppState.selectedContextPaths);
                    */
                    break;
            }
        },

        /**
         * Shows the selected item on the object page
         * On phones a additional history entry is created
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getProperty("ID")
            });
        }

    });
});
