namespace mdq.re.rule;

using {
  managed,
  cuid,
  sap.common.CodeList
} from '@sap/cds/common';

// Define a data model for managing rules in the Master Data Management (MDM) system
entity Rule : managed, cuid {

  // Description of the rule
  description       : String(255)              @mandatory;
  // Indicates if the rule is active or not
  isActive          : Boolean                  @mandatory                     @title: 'Active_T'    @label: 'Active_L';

  // Type of object to which the rule applies
  entity            : Association to one Entity

                      @mandatory
                      @title: 'Entity_T'
                      @label                         : {position: 10};

  // Type of error generated by the rule
  errorType         : ErrorType                @mandatory
                                               @title: 'Error Type'           @label: 'Error Type'
                                               @label: {position: 20};

  // Priority level of the rule
  priority          : Priority                 @mandatory
                                               @title: 'Priority'             @label: 'Priority'
                                               @label: {position: 30};

  // Description of the error generated by the rule
  errorDescription  : String(255)              @title: 'Error Description'    @label: 'Error Description';
  // Logical operator used to combine multiple conditions
  andBinaryOperator : Boolean default true                  @title: 'AND Binary Operator'  @label: 'AND Binary Operator';

  // Collection of conditions for the rule
  conditions        : Composition of many Condition
                        on conditions.parent = $self
                                               @title: 'Conditions'           @label: 'Conditions'  @mandatory;

  // Collection of actions to be executed if the conditions are met
  actions           : Composition of many Action
                        on actions.parent = $self
                                               @title: 'Actions'              @label: 'Actions'     @mandatory;
  violations_count        : Integer;
  violations           : Composition of many Violation
                        on violations.parent = $self;
                                               
}
entity Violation : managed, cuid {

  primaryKey : String(100) ;
  action  : Association to one Action;
  parent    : Association to Rule;
}


// Define the types of errors generated by the rule
type ErrorType : String(20) enum {
  Information = 'I'         @title: 'Information';
              Warning = 'I' @title: 'Warning';
              Error = 'I' @title: 'Error';
}

// Define the priority levels for the rules
type Priority  : String(20) enum {
  High   @title: 'High';
  Medium @title: 'Medium';
  Low    @title: 'Low';
}

// Define the conditions that must be satisfied for the rule to trigger an action
entity Condition : managed, cuid {

  // Attribute being evaluated by the condition
  attribute : String(50)   @title: 'Attribute'        @label: 'Attribute';
  // Comparison operator used in the condition
  operator  : Association to one Condition_operators  @title: 'Operator'  @label: 'Operator'  @mandatory;
  // Value to compare against
  value     : String(255)  @title: 'Value'            @label: 'Value'  @mandatory;
  // Reference to the parent rule
  parent    : Association to Rule;
}

entity Condition_operators {
  key name  : String(3);
      descr : String(30);
}

entity Action_operators {
  key name  : String(3);
      descr : String(30);
}

// Define the actions to be executed when the conditions of the rule are met
entity Action : managed, cuid {

  // Attribute affected by the action
  attribute : String(50)   @title: 'Attribute'     @label                    : 'Attribute';
  // Operation to be performed on the attribute
  operator  : Association to one Action_operators  @title: 'Operator'  @label: 'Operator';
  // Value used in the operation
  value     : String(255)  @title: 'Value'         @label                    : 'Value';
  // Reference to the parent rule
  parent    : Association to Rule;
}

// Define the Service entity
entity Service {

      // Name of the service
  key name     : String  @title: 'Name'      @label: 'Name';

      // Collection of entities within the service
      entities : Composition of many Entity
                   on entities.parent = $self
                         @title: 'Entities'  @label: 'Entities';
}

// Define the Entity entity
@cds.odata.valuelist
entity Entity {

      // Name of the entity
  key name     : String                 @title: 'Entity_T'  @label: 'Entity_L';
      // Reference to the parent service
      parent   : Composition of Service @title: 'Service';

      // Collection of elements within the entity
      elements : Composition of many Element
                   on elements.parent = $self
                                        @title: 'Elements'  @label: 'Elements';

      // Association to the rules applicable to this entity
      rules    : Association to many Rule
                   on rules.entity = $self
                                        @title: 'Rules'     @label: 'Rules';
}

// Define the Element entity
entity Element : cuid {

  // Name of the element
  name   : String  @title: 'Name'   @label: 'Name';
  // Data type of the element
  type   : String  @title: 'Type'   @label: 'Type';
  // Data type of the element
  title  : String  @title: 'Title'  @label: 'Tytle';
  // Reference to the parent entity
  parent : Composition of Entity;
}
