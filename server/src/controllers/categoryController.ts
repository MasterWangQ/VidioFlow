import { Request, Response } from 'express'
import { Category } from '../models/index.js'

export const categoryController = {
  // 获取所有分类
  async getCategories(req: Request, res: Response) {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    })
    res.json({ code: 0, message: 'success', data: categories })
  },

  // 获取单个分类
  async getCategory(req: Request, res: Response) {
    const { id } = req.params
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ code: 404, message: '分类不存在' })
    }
    res.json({ code: 0, message: 'success', data: category })
  },

  // 创建分类
  async createCategory(req: Request, res: Response) {
    const { name, slug, description } = req.body

    if (!name || !slug) {
      return res.status(400).json({ code: 400, message: '名称和标识不能为空' })
    }

    // 检查slug是否已存在
    const existing = await Category.findOne({ where: { slug } })
    if (existing) {
      return res.status(400).json({ code: 400, message: '该标识已存在' })
    }

    const category = await Category.create({ name, slug, description })
    res.json({ code: 0, message: '创建成功', data: category })
  },

  // 更新分类
  async updateCategory(req: Request, res: Response) {
    const { id } = req.params
    const { name, slug, description } = req.body

    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ code: 404, message: '分类不存在' })
    }

    // 检查slug是否与其他分类冲突
    if (slug && slug !== category.slug) {
      const existing = await Category.findOne({ where: { slug } })
      if (existing) {
        return res.status(400).json({ code: 400, message: '该标识已存在' })
      }
    }

    await category.update({ name, slug, description })
    res.json({ code: 0, message: '更新成功', data: category })
  },

  // 删除分类
  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ code: 404, message: '分类不存在' })
    }

    await category.destroy()
    res.json({ code: 0, message: '删除成功', data: null })
  }
}
