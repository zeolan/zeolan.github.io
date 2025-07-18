module SamplePlugin
  class CategoryPageGenerator < Jekyll::Generator
    safe true

    def generate(site)
      # Generate a page for each category (existing logic)
      site.categories.each do |category, posts|
        site.pages << CategoryPage.new(site, category, posts)
      end

      # Generate a single "Category" index page listing all categories
      site.pages << CategoryIndexPage.new(site, site.categories.keys)
    end
  end

  # Subclass of `Jekyll::Page` for individual category pages
  class CategoryPage < Jekyll::Page
    def initialize(site, category, posts)
    @site = site
    @base = site.source
    @dir  = category

    @basename = 'index'
    @ext      = '.html'
    @name     = 'index.html'

    self.process(@name)
    self.read_yaml(File.join(@base, "_layouts"), "category.html")
    self.data['linked_docs'] = posts
    self.data['category'] = category

    # Load aliases from data file
    aliases = site.data['category_aliases'] || {}
    self.data['category_alias'] = aliases[category] || category
    #self.data['title'] = aliases[category] || category

    data.default_proc = proc do |_, key|
      site.frontmatter_defaults.find(relative_path, :categories, key)
    end
  end

    def url_placeholders
      {
        :path       => @dir,
        :category   => @dir,
        :basename   => basename,
        :output_ext => output_ext,
      }
    end
  end

  # New: Page that lists all categories
  class CategoryIndexPage < Jekyll::Page
    def initialize(site, categories)
      @site = site
      @base = site.source
      @dir  = "category"
      @basename = "index"
      @ext = ".html"
      @name = "index.html"

      self.process(@name)
      self.read_yaml(File.join(@base, "_layouts"), "category_index.html")
      self.data["categories"] = categories
      # self.data["title"] = "Categories"
      self.data["category_aliases"] = site.data['category_alias'] || {}

    end
  end
end