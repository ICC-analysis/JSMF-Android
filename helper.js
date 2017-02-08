'use strict'
var jsmf = require('jsmf-core'),
    Class = jsmf.Class, Model = jsmf.Model;

//Helper model to test functionalities - should be improved with larger model
function  buildModel() {
    var MM = new Model('MetaVisu');

    var ClassA = Class.newInstance("A");
    ClassA.addAttribute('wheels', Number);
    ClassA.setReference('next',ClassA,1)

    var ClassB = Class.newInstance("B");
    ClassB.setAttribute('name',String)
    ClassB.addAttribute('quality', String);
    ClassB.setReference('wheelQuality',ClassA,-1);

    ClassA.setReference('xf',ClassB,1);

    var ClassC = Class.newInstance("C");
    ClassC.addAttribute('name', String);

    ClassA.setReference('reminder',ClassC,-1);

    MM.add([ClassA,ClassB,ClassC])

    var smallA = ClassA.newInstance();
    smallA.wheels = 4;


    var bigA = ClassA.newInstance();
    bigA.wheels = 6;
    bigA.next=smallA

    var smallB = ClassB.newInstance();
    smallB.name='TUV'
    smallB.quality = 'good';
    smallB.wheelQuality=[smallA, bigA];

    var xA  = ClassA.newInstance({wheels: 2});

    var xxA = ClassA.newInstance({wheels: 1});

    smallA.next=xA;
    xA.next=xxA;

    var smallx = ClassB.newInstance({name: 'NordVerif', quality: 'medium'});
    smallx.wheelQuality=[xA,xxA];

    var cein = ClassC.newInstance({name: 'Change'});
    smallA.reminder=cein;
    xxA.reminder=cein;

    var M = new Model('Testvisu')

    M.setReferenceModel(MM);

    M.add([smallA, smallB, bigA, cein, xA, xxA, smallx]);

    return M;
}

module.exports = {
    buildModel: buildModel
};
