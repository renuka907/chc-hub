import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import EducationTopicForm from "../components/EducationTopicForm";
import { BookOpen, Calendar, ExternalLink, Plus, Star } from "lucide-react";

export default function EducationLibrary() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: topics = [], isLoading } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => base44.entities.EducationTopic.list('-updated_date', 100),
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const categories = ["all", "Gynecology", "Hormone Replacement Therapy", "Mens Health", "Medication Education"];

    const toggleFavorite = async (topicId, currentValue) => {
        await base44.entities.EducationTopic.update(topicId, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const filteredTopics = topics.filter(topic => {
        const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            topic.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
        const matchesFavorite = !showFavoritesOnly || topic.is_favorite;
        return matchesSearch && matchesCategory && matchesFavorite;
    });

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Replacement Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "Medication Education": "bg-green-100 text-green-800"
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Patient Education Library</h1>
                            <p className="text-gray-600">Medically-reviewed educational resources for patients</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Topic
                    </Button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search education topics..."
                />
            </div>

            {/* Category Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${
                            showFavoritesOnly 
                                ? "bg-yellow-500 text-white shadow-md" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                        Favorites
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                selectedCategory === category 
                                    ? "bg-purple-600 text-white shadow-md" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {category === "all" ? "All Categories" : category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Topics Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredTopics.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No education topics found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTopics.map(topic => (
                        <div key={topic.id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group h-full relative">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(topic.id, topic.is_favorite);
                                }}
                                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <Star className={`w-4 h-4 ${topic.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                            </button>
                            <Link to={createPageUrl(`EducationDetail?id=${topic.id}`)}>
                                {topic.image_url && (
                                    <img 
                                        src={topic.image_url} 
                                        alt={topic.title}
                                        className="w-full h-40 object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-medium ${categoryColors[topic.category]}`}>
                                            {topic.category}
                                        </span>
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                        {topic.title}
                                    </h3>
                                    {topic.summary && (
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                            {topic.summary}
                                        </p>
                                    )}
                                    {topic.last_reviewed && (
                                        <div className="flex items-center text-xs text-gray-500 pt-3 border-t">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Reviewed: {new Date(topic.last_reviewed).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <EducationTopicForm
                open={showForm}
                onOpenChange={setShowForm}
                onSuccess={handleSuccess}
            />
        </div>
    );
}