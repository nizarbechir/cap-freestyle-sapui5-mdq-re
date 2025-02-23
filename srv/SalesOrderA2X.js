const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const SalesOrderA2X = await cds.connect.to("SalesOrderA2X"); 
      srv.on('READ', 'A_SalesOrder', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderBillingPlan', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderBillingPlanItem', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderHeaderPartner', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderHeaderPrElement', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItem', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemBillingPlan', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemPartner', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemPartnerAddress', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemPrElement', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemRelatedObject', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItemText', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItmPrecdgProcFlow', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderItmSubsqntProcFlow', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderPartnerAddress', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderPrecdgProcFlow', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderRelatedObject', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderScheduleLine', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderSubsqntProcFlow', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SalesOrderText', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SlsOrdPaymentPlanItemDetails', req => SalesOrderA2X.run(req.query)); 
      srv.on('READ', 'A_SlsOrderItemBillingPlanItem', req => SalesOrderA2X.run(req.query)); 
}