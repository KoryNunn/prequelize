function getSubModel(property, model){
    if(!model){
        return;
    }

    for(var key in model.associations){
        if((model.associations[key].as || model.associations[key].identifierField) === property){
            return model.associations[key];
        }
    }
}

module.exports = getSubModel;