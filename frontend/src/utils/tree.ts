export interface TreeNode {
  id: string
  parent_id?: string | null
  children?: TreeNode[]
}

export function buildTree<T extends { id: string; parent_id?: string | null }>(
  flatList: T[]
): (T & { children: (T & { children: any[] })[] })[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  flatList.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })

  flatList.forEach((item) => {
    const node = map.get(item.id)
    if (item.parent_id && map.has(item.parent_id)) {
      const parent = map.get(item.parent_id)
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}
