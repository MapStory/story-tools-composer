const compose = (...fns) => (...args) =>
  fns
    .slice(0, fns.length - 1)
    .reduceRight((result, fn) => fn(result), fns[fns.length - 1](...args));

const pipe = (...fns) => compose(...fns.reverse());

export default {
  compose,
  pipe
};
