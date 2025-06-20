async function resolveToName(Model, value) {
    if (!isNaN(value)) {
        const result = await Model.findOne({ where: { id: value } });
        if (!result) throw new Error(`${Model.name} not found: ${value}`);
        return result.name;
    } else {
        const result = await Model.findOne({ where: { name: value } });
        if (!result) throw new Error(`${Model.name} not found: ${value}`);
        return result.name;
    }
}
module.exports = resolveToName;