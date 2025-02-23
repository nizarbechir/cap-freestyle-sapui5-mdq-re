using mdq.re.rule as db from '../db/rule-model';

@path: '/rule'
service RuleService {

  entity Rule                as projection on db.Rule;
  entity Condition           as projection on db.Condition;
  entity Action              as projection on db.Action;
  entity Violation              as projection on db.Violation;
  entity Service             as projection on db.Service;
  entity Entity              as projection on db.Entity;
  entity Element             as projection on db.Element;
  entity Condition_operators as projection on db.Condition_operators;
  entity Action_operators    as projection on db.Action_operators;
  
  action checkRuleViolations(ruleID : UUID);
};
