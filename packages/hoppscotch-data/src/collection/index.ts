import { GQL_REQ_SCHEMA_VERSION, HoppGQLRequest, translateToGQLRequest } from "../graphql";
import { HoppRESTRequest, translateToNewRequest } from "../rest";

const CURRENT_COLL_SCHEMA_VER = 1

type SupportedReqTypes =
  | HoppRESTRequest
  | HoppGQLRequest

export type HoppCollection<T extends SupportedReqTypes> = {
  v: number
  name: string
  folders: HoppCollection<T>[]
  requests: T[]

  id?: string // For Firestore ID data
}

/**
 * Generates a Collection object. This ignores the version number object
 * so it can be incremented independently without updating it everywhere
 * @param x The Collection Data
 * @returns The final collection
 */

// Omit是TypeScript3.5新增的一个辅助类型，它的作用主要是：以一个类型为基础支持剔除某些属性，然后返回一个新类型。

// type Person = {
//     name: string;
//     age: string;
//     location: string;
// };

// type PersonWithoutLocation = Omit<Person, 'location'>;

// // PersonWithoutLocation equal to QuantumPerson
// type QuantumPerson = {
//     name: string;
//     age: string;
// };

// 使用展开运算符以给定的方式从现有对象创建对象。

// let origObjectOne = {a: 1, b: 2, c: 3}; 				//{a: 1, b: 2, c: 3}
// let origObjectTwo = {d: 4, e: 5, f: 6};					//{d: 4, e: 5, f: 6}

// //Create new object from existing object
// let copyObject = {...origObjectOne}; 						//{a: 1, b: 2, c: 3}
export function makeCollection<T extends SupportedReqTypes>(
  x: Omit<HoppCollection<T>, "v">
): HoppCollection<T> {
  return {
    v: CURRENT_COLL_SCHEMA_VER,
    ...x
  }
}

/**
 * Translates an old collection to a new collection
 * @param x The collection object to load
 * @returns The proper new collection format
 */
export function translateToNewRESTCollection(
  x: any
): HoppCollection<HoppRESTRequest> {
  if (x.v && x.v === 1) return x

  // Legacy
  const name = x.name ?? "Untitled"
  const folders = (x.folders ?? []).map(translateToNewRESTCollection)
  const requests = (x.requests ?? []).map(translateToNewRequest)

  const obj = makeCollection<HoppRESTRequest>({
    name,
    folders,
    requests,
  })

  if (x.id) obj.id = x.id

  return obj
}

/**
 * Translates an old collection to a new collection
 * @param x The collection object to load
 * @returns The proper new collection format
 */
export function translateToNewGQLCollection(
  x: any
): HoppCollection<HoppGQLRequest> {
  if (x.v && x.v === GQL_REQ_SCHEMA_VERSION) return x

  // Legacy
  const name = x.name ?? "Untitled"
  const folders = (x.folders ?? []).map(translateToNewGQLCollection)
  const requests = (x.requests ?? []).map(translateToGQLRequest)

  const obj = makeCollection<HoppGQLRequest>({
    name,
    folders,
    requests,
  })

  if (x.id) obj.id = x.id

  return obj
}

