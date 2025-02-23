const cds = require('@sap/cds');
const TextBundle = require('@sap/textbundle').TextBundle;


/**
 * Executes rules and actions before creating, updating, or upserting Master_Data_Articles.
 * @param {Service} srv - The CDS service instance.
 */
module.exports = cds.service.impl(async srv => {
  // Connect to CatalogService

  const { Rule, Service, Violation } = srv.entities('mdq.re.rule');
  const bundle = new TextBundle('i18n/i18n', 'en_EN');

  cds.on('serving', async srv => {
    if (srv.name !== 'RuleService' && srv.options.kind === 'app-service') {
      await processService(srv);
    }
  });

  async function processService(srv) {
    const entities = await extractEntities(srv);
    const result = await insertService(srv.name, entities);
    console.log("Result:", result);
    attachEvents(srv.name, entities);
  }

  async function extractEntities(srv) {
    const entities = [];
    for (let entity of srv.entities) {
      if (entity.kind === 'entity' && entity['@Common.Label'] !== '{i18n>Draft_DraftAdministrativeData}') {
        const elements = extractEntityElements(entity.elements);
        entities.push({ name: entity.name, elements });
      }
    }
    return entities;
  }

  // Define a separate function to retrieve the label from the @title annotation
  function getLabelFromTitleAnnotation(titleAnnotation, name) {
    if (!titleAnnotation) {
      return name;
    }

    let valueTitleAnnot;
    if (titleAnnotation.startsWith('{i18n>')) {
      valueTitleAnnot = titleAnnotation.substring(6, titleAnnotation.length - 1);
    } else {
      valueTitleAnnot = titleAnnotation;
    }
    return bundle.getText(valueTitleAnnot);
  }

  // Modify the extractEntityElements function to use the new function
  function extractEntityElements(elements) {
    return Object.keys(elements)
      .filter(key => {
        const element = elements[key];
        return !!(element.type !== 'cds.Association' || (element.virtual && element.virtual !== true));
      })
      .map(key => {
        const titleAnnot = elements[key]['@title'];
        const label = getLabelFromTitleAnnotation(titleAnnot, elements[key].name);

        const element = { name: key, type: elements[key].type, title: label };
        return element;
      });
  }


  async function insertService(serviceName, entities) {
    try {
      const result = await INSERT.into(Service, [{ name: serviceName, entities }]);
      return result;
    } catch (error) {
      console.error("UPSERT operation failed:", error);
      throw error;
    }
  }

  async function attachEvents(service, entities) {
    const aEntities = entities.map(entity => entity.name);
    let versService = await cds.connect.to(service);
    versService.before(['CREATE', 'UPDATE', 'UPSERT'], aEntities, async (req) => {
      try {
        const payload = req.data;
        const tableName = req.path;
        const ruleDefinitions = await getActiveRuleDefinitions(tableName);

        for (const rule of ruleDefinitions) {
          const actionMet = checkRulesAndActions(payload, tableName, rule);
          if (!actionMet) {
            const errorInfo = rule.errorDescription ? rule.errorDescription : rule.description;
            req.error(422, `RULE_Service ${errorInfo}`, rule.entity_name);
          }
        }
      } catch (error) {
        console.error('Error executing rule:', error);
        req.reject(500, 'Internal Server Error');
      }
    });
  }

  // Expose the custom action
  srv.on('checkRuleViolations', async req => {
    const { ruleID } = req.data;
    // Compute the number of rule violations
    const { violations_count, violation_list } = await checkRuleViolations(ruleID);

    //Reset Valuation table
    await DELETE.from(Violation);
    // Update the Rule entity with the computed violation count
    await UPDATE(Rule).set({ violations_count: violations_count }).where({ ID: ruleID });
    // association the respective violatios to show them in the UI
    await INSERT.into(Violation, violation_list);
  });

  async function checkRuleViolations(ruleID) {
    const rule = await getRule(ruleID);
    const { conditions, actions, andBinaryOperator, entity_name } = rule;

    const service = entity_name.split('.')[0]
    const entity = entity_name.split('.')[1]
    const dataToAnalyze = await getEntityData(service, entity);

    // Retrieve the entity definition from the CDS metadata
    // (Assuming the entity is available on cds.entities or srv.entities)
    let rightService = await cds.connect.to(service);
    const entityDefinition = rightService.entities[entity];

    // Extract primary key attribute(s)
    const primaryKeyAttributes = Object.keys(entityDefinition.elements).filter(key => {
      return entityDefinition.elements[key].key === true;
    });


    let violations_count = 0;
    let violation_list = [];

    dataToAnalyze.forEach(record => {
      // Evaluate conditions on each record
      const conditionMet = evaluateConditions(conditions, record, andBinaryOperator);
      if (conditionMet) {
        // If conditions are met, evaluate actions
        const { actionMet, violations } = evaluateActions(actions, record, primaryKeyAttributes, entity, ruleID);
        if (!actionMet) {
          violations_count++; // Count non-compliant records
          violation_list.push(...violations);

        }
      }
    });

    // Optionally: update your rule record with violationCount, log, or perform additional actions
    return { violations_count, violation_list }; // Return the total count of violations
  }

  async function getEntityData(service, entity) {
    // Assuming entity_name is namespaced like "namespace.EntityName"
    // We split and use the actual entity name for the SELECT
    let rightService = await cds.connect.to(service);
    return await rightService.run(SELECT.from(entity, entity => {
      entity`.*`
    }).limit(1000));
  }

  async function getRule(ruleId) {
    return await SELECT.one.from(Rule, rule => {
      rule`.*`,
        rule.conditions(condition => {
          condition`.*`
        }),
        rule.actions(action => {
          action`.*`
        })
    }).where({ ID: ruleId });
  }

  // Evaluate conditions based on AND/OR logic (andBinaryOperator: true for AND, false for OR)
  function evaluateConditions(conditions, payload, andBinaryOperator) {
    const evaluateCondition = condition => {
      const { attribute, operator_name, value } = condition;
      const payloadValue = payload[attribute];
      return compareValues(payloadValue, operator_name, value);
    };

    return (andBinaryOperator ? conditions.every : conditions.some).call(conditions, evaluateCondition);
  }

  // Evaluate actions and track any failing ones, including the primary key string
  function evaluateActions(actions, payload, primaryKeyAttributes, entity, ruleID) {
    let actionMet = true;
    let violations = [];

    // Define the entity path (adjust as needed or pass as parameter)
    const entityPath = "/" + entity;

    actions.forEach(action => {
      const { attribute, operator_name, value } = action;
      const payloadValue = payload[attribute];
      const result = compareValues(payloadValue, operator_name, value);
      if (!result) {
        // Build a string of primary key values in the format key1=value1,key2=value2,...
        const pkValues = primaryKeyAttributes
          .map(key => `${key}=${payload[key]}`)
          .join(",");
        // Construct the complete string with the entity path
        const pkString = `${entityPath}(${pkValues})`;

        violations.push({ primaryKey: pkString, action_ID: action.ID, parent_ID: ruleID });
        actionMet = false;
      }
    });

    return { actionMet, violations };
  }

  // Compare values with type conversion
  function compareValues(value1, operator_name, value2) {
    [value1, value2] = convertTypes(value1, value2);
    switch (operator_name) {
      case 'EQ': return value1 == value2;
      case 'NE': return value1 != value2;
      case 'GT': return value1 > value2;
      case 'GE': return value1 >= value2;
      case 'LT': return value1 < value2;
      case 'LE': return value1 <= value2;
      default: throw new Error(`Unsupported operator: ${operator_name}`);
    }
  }

  // Convert values for proper comparison (numbers, booleans, or strings)
  function convertTypes(value1, value2) {
    if (!isNaN(value1) && !isNaN(value2)) {
      return [Number(value1), Number(value2)];
    } else if (typeof value1 === 'boolean' || typeof value2 === 'boolean') {
      return [Boolean(value1), Boolean(value2)];
    } else {
      return [String(value1), String(value2)];
    }
  }


});