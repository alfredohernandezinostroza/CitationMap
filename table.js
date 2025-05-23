// import { papersTable } from './app.js';

// //Clear filters on "Clear Filters" button click
// document.getElementById('filter-clear').addEventListener('click',
// //Custom filter example
// function customFilter(data) {
//   return data.car && data.rating < 3;
// }

//Trigger setFilter function with correct parameters
export function updateFilter(table) {
  console.log('updatinig filter!');
  //Define variables for input elements
  let fieldEl = document.getElementById('filter-field');
  let typeEl = document.getElementById('filter-type');
  let valueEl = document.getElementById('filter-value');

  let filterVal = fieldEl.options[fieldEl.selectedIndex].value;
  let typeVal = typeEl.options[typeEl.selectedIndex].value;

  let filter = filterVal == 'function' ? customFilter : filterVal;

  if (filterVal == 'function') {
    typeEl.disabled = true;
    valueEl.disabled = true;
  } else {
    typeEl.disabled = false;
    valueEl.disabled = false;
  }

  if (filterVal) {
    console.log(filter, typeVal, valueEl.value);
    table.setFilter(filter, typeVal, valueEl.value);
  }
}
export function clearFilters(table) {
  //Define variables for input elements
  let fieldEl = document.getElementById('filter-field');
  let typeEl = document.getElementById('filter-type');
  let valueEl = document.getElementById('filter-value');

  fieldEl.value = '';
  typeEl.value = 'like';
  valueEl.value = '';

  table.clearFilter();
}
