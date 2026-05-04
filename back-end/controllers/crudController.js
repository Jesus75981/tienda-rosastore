export const createCrudController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // 0 significa sin limite
        const search = req.query.search || '';
        
        let query = {};
        
        // Si hay término de búsqueda, buscar en todos los campos string del modelo
        if (search) {
          const searchRegex = new RegExp(search, 'i');
          const searchConditions = [];
          
          Object.keys(Model.schema.paths).forEach(path => {
            if (Model.schema.paths[path].instance === 'String') {
              searchConditions.push({ [path]: searchRegex });
            }
          });
          
          if (searchConditions.length > 0) {
            query = { $or: searchConditions };
          }
        }

        if (limit > 0) {
          const skip = (page - 1) * limit;
          const [docs, total] = await Promise.all([
            Model.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
            Model.countDocuments(query)
          ]);
          res.status(200).json({
            data: docs,
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
          });
        } else {
          // Compatibilidad: si no hay limit, devuelve solo el array
          const docs = await Model.find(query).sort({ createdAt: -1 });
          res.status(200).json(docs);
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
    getOne: async (req, res) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json(doc);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
    create: async (req, res) => {
      try {
        const newDoc = new Model(req.body);
        const savedDoc = await newDoc.save();
        res.status(201).json(savedDoc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    update: async (req, res) => {
      try {
        const data = { ...req.body };
        delete data._id; // Prevent updating immutable field _id
        const updatedDoc = await Model.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!updatedDoc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json(updatedDoc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    remove: async (req, res) => {
      try {
        const deletedDoc = await Model.findByIdAndDelete(req.params.id);
        if (!deletedDoc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json({ message: 'Eliminado correctamente' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  };
};
