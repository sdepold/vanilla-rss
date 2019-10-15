//GLOBAL VARIABLES
var duration = 15,
  height,
  interval,
  counter

//#3 the slideDown
export function slideDown(element, callback) {
  var adder = height / 10; //the height is global variable

  console.log(element.outerHTML)
  element.style.display='';
  console.log(element.outerHTML)

  //iteratively increase the height
  interval = setInterval(function() {
    counter += adder;
    if (counter < height) {
      element.style.height = counter + "px";
    } else {
      element.style.height = height + "px";
      clearInterval(interval);
      callback && callback();
    }
  }, duration);
}
