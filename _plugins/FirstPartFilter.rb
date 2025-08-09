module Jekyll
  module FirstPartFilter
    def first_part(input)
      return input.to_s.split(' - ')[0]
    end
  end
end

Liquid::Template.register_filter(Jekyll::FirstPartFilter)