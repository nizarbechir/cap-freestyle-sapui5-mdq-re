using {mdq.re.rule as schema} from '../../db/rule-model';

annotate schema.Rule with @(UI: {
    SelectionFields: [
        description,
        errorDescription
    ],
    LineItem       : [
        {
            Value: description,
            Label: 'Description^^'
        },
        {
            Value: errorDescription,
            Label: 'ErrorDesc^^'
        }
    ],
    HeaderInfo     : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Rule^^',
        TypeNamePlural: 'Rules^^',
        Title         : {Value: ID},
        Description   : {Value: description}
    }
});

annotate schema.Entity with @(UI: {
    SelectionFields: [
        name
    ],
    LineItem       : [
        {Value: parent_name},
        {Value: name}

    ]
});

annotate schema.Condition with @(UI: {
    LineItem       : [
        {Value: attribute},
        {Value: createdAt}
    ],
    HeaderInfo     : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Condition^^',
        TypeNamePlural: 'Conditions^^'
    }
});
