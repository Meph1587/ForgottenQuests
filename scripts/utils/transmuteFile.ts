
const wizardTraits = require("../../data/wizardsFull");
const fs = require('fs');

export function run(){


    let output = {"names" :new Array(), "traits":new Array()};

    let allTraits = new Set();
    let names = new Array();
    for(let i=0 ; i<10000;i++){
        let profile = wizardTraits[i.toString()];
        allTraits.add("aff:"+profile.Affinity)
        allTraits.add(profile.Prop)
        allTraits.add(profile.Head)
        allTraits.add(profile.Body)
        allTraits.add(profile.Familiar)
        allTraits.add(profile.Rune)
        allTraits.add(profile.Background)

        let nameList = new Array();
        nameList.push(i.toString())
        nameList.push(profile.FullName)
        output.names.push(nameList)
    };
   

    let traitArray = Array.from(allTraits);
    traitArray.sort()

    console.log(traitArray)
    console.log(traitArray.length, traitArray[0], traitArray[traitArray.length -1])

    let map = new Map()
    traitArray.forEach((element, i) => {
        map.set(element, i)
    });
    map.set("None", 7777)

    for(let i=0 ; i<10000;i++){
        let profile = wizardTraits[i.toString()];
        let wizardList = new Array();
        wizardList.push(i)
        wizardList.push(map.get("aff:"+profile.Affinity))
        wizardList.push(map.get(profile.Prop))
        wizardList.push(map.get(profile.Head))
        wizardList.push(map.get(profile.Body))
        wizardList.push(map.get(profile.Familiar))
        wizardList.push(map.get(profile.Rune))
        wizardList.push(map.get(profile.Background))
        output.traits.push(wizardList)
    };

    const outputJSON = JSON.stringify(output);

    fs.writeFileSync('wizardsNew.json', outputJSON);

    console.log(traitArray.reduce((p,c) => (p + "-" + c), ""))

}

run()
