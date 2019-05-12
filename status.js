function Status(id, name) {
  this.name = name;
  this.id = id;
}

const StatusObj = {
  Created: new Status(10, 'created'),
  Started: new Status(20, 'started'),
  Aborted: new Status(35, 'aborted'),
  NoStart: new Status(37, 'nostart'),
  VariantEnd: new Status(60, 'variantend'),
  make: (id) => {
    return StatusObj.byId[id];
  }
};

StatusObj.all = [StatusObj.Created, StatusObj.Started, StatusObj.Aborted, StatusObj.NoStart, StatusObj.VariantEnd],

StatusObj.byId = StatusObj.all.reduce((obj, s) =>
  ({ [s.id]: s, ...obj }) ,{}),


module.exports = StatusObj;
